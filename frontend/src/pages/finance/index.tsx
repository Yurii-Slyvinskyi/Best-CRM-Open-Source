import { useCallback, useEffect, useMemo, useState } from 'react';
import { getProjects, type Project } from '../../entities/project';
import {
  createManagerPayment,
  createManagerSalary,
  createTransaction,
  deleteManagerPayment,
  deleteManagerSalary,
  deleteTransaction,
  getFinancialReports,
  getManagerPayments,
  getManagerSalaries,
  getTransactions,
  refreshFinancialReport,
  updateManagerPayment,
  updateManagerPaymentStatus,
  updateManagerSalary,
  updateTransaction,
  type FinancialReport,
  type ManagerPaymentPayload,
  type ManagerSalaryPayload,
  type Payment,
  type PaymentStatus,
  type Salary,
  type Transaction,
  type TransactionPayload,
} from '../../entities/finance';
import { getUsers, type UserProfile } from '../../entities/user';
import { getApiErrorMessage } from '../../shared/api';
import { ErrorState } from '../../shared/ui/error-state';
import { LoadingState } from '../../shared/ui/loading-state';
import { Modal } from '../../shared/ui/modal';
import { PageShell } from '../../shared/ui/page-shell';
import {
  parseDate,
  sortByDate,
  type SortOrder,
} from './model/finance-helpers';
import { PaymentForm } from './ui/payment-form';
import { PaymentsSection } from './ui/payments-section';
import { SalariesSection } from './ui/salaries-section';
import { SalaryForm } from './ui/salary-form';
import { SummarySection } from './ui/summary-section';
import { TransactionForm } from './ui/transaction-form';
import { TransactionsSection } from './ui/transactions-section';

export function FinancePage() {
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [transactionSearch, setTransactionSearch] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [transactionSort, setTransactionSort] = useState<SortOrder>('newest');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentSort, setPaymentSort] = useState<SortOrder>('newest');
  const [salarySearch, setSalarySearch] = useState('');
  const [salarySort, setSalarySort] = useState<SortOrder>('newest');

  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [pendingDeletePaymentId, setPendingDeletePaymentId] = useState<number | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<number | null>(null);

  const [isSalaryFormOpen, setIsSalaryFormOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);
  const [pendingDeleteSalaryId, setPendingDeleteSalaryId] = useState<number | null>(null);
  const [deletingSalaryId, setDeletingSalaryId] = useState<number | null>(null);

  const loadFinance = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const [
        reportsResult,
        transactionsResult,
        paymentsResult,
        salariesResult,
        usersResult,
        projectsResult,
      ] = await Promise.allSettled([
        getFinancialReports(),
        getTransactions(),
        getManagerPayments(),
        getManagerSalaries(),
        getUsers(),
        getProjects(),
      ]);

      const financeResults = [reportsResult, transactionsResult, paymentsResult, salariesResult];

      if (financeResults.every((result) => result.status === 'rejected')) {
        throw (reportsResult as PromiseRejectedResult).reason;
      }

      if (reportsResult.status === 'fulfilled') {
        setReports(reportsResult.value);
      }

      if (transactionsResult.status === 'fulfilled') {
        setTransactions(transactionsResult.value);
      }

      if (paymentsResult.status === 'fulfilled') {
        setPayments(paymentsResult.value);
      }

      if (salariesResult.status === 'fulfilled') {
        setSalaries(salariesResult.value);
      }

      if (usersResult.status === 'fulfilled') {
        setUsers(usersResult.value);
      }

      if (projectsResult.status === 'fulfilled') {
        setProjects(projectsResult.value);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Finance data could not be loaded. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinance();
  }, [loadFinance]);

  async function reloadTransactionsAndReports() {
    const [transactionsData, reportsData] = await Promise.all([getTransactions(), getFinancialReports()]);
    setTransactions(transactionsData);
    setReports(reportsData);
  }

  async function handleRefreshSummary() {
    setIsRefreshing(true);
    setActionError('');
    setNotice('');

    try {
      // Refresh recomputes the report for the whole company; never scope by date here.
      await refreshFinancialReport({});
      const updatedReports = await getFinancialReports();
      setReports(updatedReports);
      setNotice('Financial summary refreshed.');
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Summary could not be refreshed.'));
    } finally {
      setIsRefreshing(false);
    }
  }

  function openCreateTransaction() {
    setNotice('');
    setActionError('');
    setEditingTransaction(null);
    setIsTransactionFormOpen(true);
  }

  function openEditTransaction(transaction: Transaction) {
    setNotice('');
    setActionError('');
    setEditingTransaction(transaction);
    setIsTransactionFormOpen(true);
  }

  function closeTransactionForm() {
    setIsTransactionFormOpen(false);
    setEditingTransaction(null);
  }

  function requestDeleteTransaction(transaction: Transaction) {
    setActionError('');
    setPendingDeleteId(transaction.id);
  }

  async function handleSubmitTransaction(payload: TransactionPayload) {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, payload);
      setNotice('Transaction updated.');
    } else {
      await createTransaction(payload);
      setNotice('Transaction created.');
    }

    closeTransactionForm();
    await reloadTransactionsAndReports();
  }

  async function handleDeleteTransaction(transaction: Transaction) {
    setDeletingId(transaction.id);
    setActionError('');
    setNotice('');

    try {
      await deleteTransaction(transaction.id);
      setPendingDeleteId(null);
      setNotice('Transaction deleted.');
      await reloadTransactionsAndReports();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Transaction could not be deleted.'));
    } finally {
      setDeletingId(null);
    }
  }

  function openCreatePayment() {
    setNotice('');
    setActionError('');
    setEditingPayment(null);
    setIsPaymentFormOpen(true);
  }

  function openEditPayment(payment: Payment) {
    setNotice('');
    setActionError('');
    setEditingPayment(payment);
    setIsPaymentFormOpen(true);
  }

  function closePaymentForm() {
    setIsPaymentFormOpen(false);
    setEditingPayment(null);
  }

  function requestDeletePayment(payment: Payment) {
    setActionError('');
    setPendingDeletePaymentId(payment.id);
  }

  async function handleSubmitPayment(payload: ManagerPaymentPayload) {
    if (editingPayment) {
      await updateManagerPayment(editingPayment.id, payload);
      setNotice('Payment request updated. A new checkout link is available in the payments table.');
    } else {
      const payment = await createManagerPayment(payload);
      setNotice(payment.session_url
        ? 'Payment request created. A checkout link is available in the payments table.'
        : 'Payment request created.');
    }

    closePaymentForm();
    const paymentsData = await getManagerPayments();
    setPayments(paymentsData);
  }

  async function handleDeletePayment(payment: Payment) {
    setDeletingPaymentId(payment.id);
    setActionError('');
    setNotice('');

    try {
      await deleteManagerPayment(payment.id);
      setPendingDeletePaymentId(null);
      setNotice('Payment deleted.');
      const paymentsData = await getManagerPayments();
      setPayments(paymentsData);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Payment could not be deleted.'));
    } finally {
      setDeletingPaymentId(null);
    }
  }

  async function handleChangePaymentStatus(payment: Payment, status: PaymentStatus) {
    if (status === payment.status) {
      return;
    }

    setActionError('');
    setNotice('');

    try {
      await updateManagerPaymentStatus(payment.id, status);
      setNotice('Payment status updated.');
      const paymentsData = await getManagerPayments();
      setPayments(paymentsData);
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Payment status could not be updated.'));
    }
  }

  async function reloadSalariesTransactionsReports() {
    const [salariesData, transactionsData, reportsData] = await Promise.all([
      getManagerSalaries(),
      getTransactions(),
      getFinancialReports(),
    ]);
    setSalaries(salariesData);
    setTransactions(transactionsData);
    setReports(reportsData);
  }

  function openCreateSalary() {
    setNotice('');
    setActionError('');
    setEditingSalary(null);
    setIsSalaryFormOpen(true);
  }

  function openEditSalary(salary: Salary) {
    setNotice('');
    setActionError('');
    setEditingSalary(salary);
    setIsSalaryFormOpen(true);
  }

  function closeSalaryForm() {
    setIsSalaryFormOpen(false);
    setEditingSalary(null);
  }

  function requestDeleteSalary(salary: Salary) {
    setActionError('');
    setPendingDeleteSalaryId(salary.id);
  }

  async function handleSubmitSalary(payload: ManagerSalaryPayload) {
    if (editingSalary) {
      await updateManagerSalary(editingSalary.id, payload);
      setNotice('Salary updated.');
    } else {
      await createManagerSalary(payload);
      setNotice('Salary recorded.');
    }

    closeSalaryForm();
    await reloadSalariesTransactionsReports();
  }

  async function handleDeleteSalary(salary: Salary) {
    setDeletingSalaryId(salary.id);
    setActionError('');
    setNotice('');

    try {
      await deleteManagerSalary(salary.id);
      setPendingDeleteSalaryId(null);
      setNotice('Salary deleted.');
      await reloadSalariesTransactionsReports();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Salary could not be deleted.'));
    } finally {
      setDeletingSalaryId(null);
    }
  }

  function getClientLabel(clientId: number) {
    const client = users.find((currentUser) => currentUser.id === clientId);
    return client ? `${client.username} #${client.id}` : `Client #${clientId}`;
  }

  function getWorkerLabel(workerId: number) {
    const worker = users.find((currentUser) => currentUser.id === workerId);
    return worker ? `${worker.username} #${worker.id}` : `Worker #${workerId}`;
  }

  function getProjectLabel(projectId: number) {
    const project = projects.find((currentProject) => currentProject.id === projectId);
    return project ? `${project.name} #${project.id}` : `Project #${projectId}`;
  }

  const clients = useMemo(() => users.filter((currentUser) => currentUser.role === 'client'), [users]);
  const workers = useMemo(() => users.filter((currentUser) => currentUser.role === 'worker'), [users]);

  const latestReport = useMemo(() => {
    if (!reports.length) {
      return null;
    }

    return [...reports].sort((a, b) => {
      const aTime = parseDate(a.generated_at)?.getTime() ?? 0;
      const bTime = parseDate(b.generated_at)?.getTime() ?? 0;
      return bTime - aTime;
    })[0];
  }, [reports]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = transactionSearch.trim().toLowerCase();

    const matched = transactions.filter((transaction) => {
      const matchesSearch = !normalizedSearch
        || transaction.description.toLowerCase().includes(normalizedSearch);
      const matchesType = !transactionType || transaction.transaction_type === transactionType;

      return matchesSearch && matchesType;
    });

    return sortByDate(matched, (transaction) => transaction.created_at, transactionSort);
  }, [transactions, transactionSearch, transactionType, transactionSort]);

  const filteredPayments = useMemo(() => {
    const normalizedSearch = paymentSearch.trim().toLowerCase();

    const matched = payments.filter((payment) => {
      const matchesSearch = !normalizedSearch || [
        getClientLabel(payment.client),
        getProjectLabel(payment.project),
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
      const matchesStatus = !paymentStatus || payment.status === paymentStatus;

      return matchesSearch && matchesStatus;
    });

    return sortByDate(matched, (payment) => payment.created_at, paymentSort);
  }, [payments, paymentSearch, paymentStatus, paymentSort, users, projects]);

  const filteredSalaries = useMemo(() => {
    const normalizedSearch = salarySearch.trim().toLowerCase();

    const matched = salaries.filter((salary) => (
      !normalizedSearch || getWorkerLabel(salary.worker).toLowerCase().includes(normalizedSearch)
    ));

    return sortByDate(matched, (salary) => salary.date_paid, salarySort);
  }, [salaries, salarySearch, salarySort, users]);

  return (
    <PageShell
      eyebrow="CRM FINANCE"
      title="Finance"
      subtitle="Manager view for the company financial summary, transactions, payments, and salaries."
      width="wide"
    >
      {isLoading && (
        <LoadingState
          title="Loading finance"
          description="Fetching the financial summary, transactions, payments, and salaries."
        />
      )}

      {!isLoading && error && (
        <ErrorState title="Unable to load finance data" message={error} />
      )}

      {!isLoading && !error && (
        <div className="space-y-8">
          {notice && (
            <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900">
              {notice}
            </div>
          )}

          {actionError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {actionError}
            </div>
          )}

          <SummarySection
            latestReport={latestReport}
            isRefreshing={isRefreshing}
            onRefresh={handleRefreshSummary}
          />

          <TransactionsSection
            transactions={transactions}
            filteredTransactions={filteredTransactions}
            search={transactionSearch}
            type={transactionType}
            sort={transactionSort}
            pendingDeleteId={pendingDeleteId}
            deletingId={deletingId}
            onSearchChange={setTransactionSearch}
            onTypeChange={setTransactionType}
            onSortChange={setTransactionSort}
            onCreate={openCreateTransaction}
            onEdit={openEditTransaction}
            onRequestDelete={requestDeleteTransaction}
            onConfirmDelete={handleDeleteTransaction}
            onCancelDelete={() => setPendingDeleteId(null)}
          />

          <PaymentsSection
            payments={payments}
            filteredPayments={filteredPayments}
            search={paymentSearch}
            status={paymentStatus}
            sort={paymentSort}
            pendingDeleteId={pendingDeletePaymentId}
            deletingId={deletingPaymentId}
            getClientLabel={getClientLabel}
            getProjectLabel={getProjectLabel}
            onSearchChange={setPaymentSearch}
            onStatusChange={setPaymentStatus}
            onSortChange={setPaymentSort}
            onCreate={openCreatePayment}
            onEdit={openEditPayment}
            onChangeStatus={handleChangePaymentStatus}
            onRequestDelete={requestDeletePayment}
            onConfirmDelete={handleDeletePayment}
            onCancelDelete={() => setPendingDeletePaymentId(null)}
          />

          <SalariesSection
            salaries={salaries}
            filteredSalaries={filteredSalaries}
            search={salarySearch}
            sort={salarySort}
            pendingDeleteId={pendingDeleteSalaryId}
            deletingId={deletingSalaryId}
            getWorkerLabel={getWorkerLabel}
            onSearchChange={setSalarySearch}
            onSortChange={setSalarySort}
            onCreate={openCreateSalary}
            onEdit={openEditSalary}
            onRequestDelete={requestDeleteSalary}
            onConfirmDelete={handleDeleteSalary}
            onCancelDelete={() => setPendingDeleteSalaryId(null)}
          />
        </div>
      )}

      {isTransactionFormOpen && (
        <Modal size="2xl">
          <TransactionForm
            mode={editingTransaction ? 'edit' : 'create'}
            transaction={editingTransaction}
            onSubmit={handleSubmitTransaction}
            onCancel={closeTransactionForm}
          />
        </Modal>
      )}

      {isPaymentFormOpen && (
        <Modal size="2xl">
          <PaymentForm
            mode={editingPayment ? 'edit' : 'create'}
            payment={editingPayment}
            clients={clients}
            projects={projects}
            onSubmit={handleSubmitPayment}
            onCancel={closePaymentForm}
          />
        </Modal>
      )}

      {isSalaryFormOpen && (
        <Modal size="2xl">
          <SalaryForm
            mode={editingSalary ? 'edit' : 'create'}
            salary={editingSalary}
            workers={workers}
            onSubmit={handleSubmitSalary}
            onCancel={closeSalaryForm}
          />
        </Modal>
      )}
    </PageShell>
  );
}

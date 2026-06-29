import { apiClient } from '../../../shared/api';
import type {
  FinancialReport,
  FinancialReportRefreshPayload,
  ManagerPaymentPayload,
  ManagerSalaryPayload,
  Payment,
  PaymentStatus,
  Salary,
  Transaction,
  TransactionPayload,
  TransactionUpdatePayload,
} from '../model/types';

export function getPayments(): Promise<Payment[]> {
  return apiClient<Payment[]>('/api/finances/payments/');
}

export function getManagerPayments(): Promise<Payment[]> {
  return apiClient<Payment[]>('/api/finances/payments/manager/');
}

export function createManagerPayment(payload: ManagerPaymentPayload): Promise<Payment> {
  return apiClient<Payment>('/api/finances/payments/manager/', {
    method: 'POST',
    body: payload,
  });
}

export function updateManagerPayment(
  paymentId: string | number,
  payload: ManagerPaymentPayload,
): Promise<Payment> {
  return apiClient<Payment>(`/api/finances/payments/manager/${paymentId}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export function updateManagerPaymentStatus(
  paymentId: string | number,
  status: PaymentStatus,
): Promise<Payment> {
  return apiClient<Payment>(`/api/finances/payments/manager/${paymentId}/`, {
    method: 'PATCH',
    body: { status },
  });
}

export function deleteManagerPayment(paymentId: string | number): Promise<void> {
  return apiClient<void>(`/api/finances/payments/manager/${paymentId}/`, {
    method: 'DELETE',
  });
}

export function getManagerSalaries(): Promise<Salary[]> {
  return apiClient<Salary[]>('/api/finances/salaries/manager/');
}

export function createManagerSalary(payload: ManagerSalaryPayload): Promise<Salary> {
  return apiClient<Salary>('/api/finances/salaries/manager/', {
    method: 'POST',
    body: payload,
  });
}

export function updateManagerSalary(
  salaryId: string | number,
  payload: ManagerSalaryPayload,
): Promise<Salary> {
  return apiClient<Salary>(`/api/finances/salaries/manager/${salaryId}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteManagerSalary(salaryId: string | number): Promise<void> {
  return apiClient<void>(`/api/finances/salaries/manager/${salaryId}/`, {
    method: 'DELETE',
  });
}

export function getWorkerSalaries(): Promise<Salary[]> {
  return apiClient<Salary[]>('/api/finances/salaries/worker/');
}

export function getTransactions(): Promise<Transaction[]> {
  return apiClient<Transaction[]>('/api/finances/transactions/');
}

export function createTransaction(payload: TransactionPayload): Promise<Transaction> {
  return apiClient<Transaction>('/api/finances/transactions/', {
    method: 'POST',
    body: payload,
  });
}

export function updateTransaction(
  transactionId: string | number,
  payload: TransactionUpdatePayload,
): Promise<Transaction> {
  return apiClient<Transaction>(`/api/finances/transactions/${transactionId}/`, {
    method: 'PATCH',
    body: payload,
  });
}

export function deleteTransaction(transactionId: string | number): Promise<void> {
  return apiClient<void>(`/api/finances/transactions/${transactionId}/`, {
    method: 'DELETE',
  });
}

export function getFinancialReports(): Promise<FinancialReport[]> {
  return apiClient<FinancialReport[]>('/api/finances/reports/');
}

export function refreshFinancialReport(
  payload: FinancialReportRefreshPayload = {},
): Promise<FinancialReport> {
  return apiClient<FinancialReport>('/api/finances/reports/', {
    method: 'POST',
    body: payload,
  });
}

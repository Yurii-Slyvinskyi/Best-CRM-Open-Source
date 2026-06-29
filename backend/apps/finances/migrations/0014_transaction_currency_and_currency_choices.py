from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finances', '0013_transaction_salary'),
    ]

    operations = [
        migrations.AddField(
            model_name='transaction',
            name='currency',
            field=models.CharField(
                choices=[('USD', 'USD'), ('CAD', 'CAD')],
                default='USD',
                max_length=3,
            ),
        ),
        migrations.AlterField(
            model_name='payment',
            name='currency',
            field=models.CharField(
                choices=[('USD', 'USD'), ('CAD', 'CAD')],
                default='USD',
                max_length=3,
            ),
        ),
        migrations.AlterField(
            model_name='salary',
            name='currency',
            field=models.CharField(
                choices=[('USD', 'USD'), ('CAD', 'CAD')],
                default='USD',
                max_length=3,
            ),
        ),
    ]

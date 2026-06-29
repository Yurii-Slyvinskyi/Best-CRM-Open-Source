from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finances', '0011_alter_payment_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='financialreport',
            name='generated_at',
            field=models.DateTimeField(auto_now=True),
        ),
    ]

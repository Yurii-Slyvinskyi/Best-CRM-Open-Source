import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finances', '0012_alter_financialreport_generated_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='transaction',
            name='salary',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='transactions',
                to='finances.salary',
            ),
        ),
    ]

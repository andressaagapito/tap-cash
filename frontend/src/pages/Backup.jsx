import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Download, Upload, AlertTriangle, CheckCircle2, AlertCircle, Database, FileSpreadsheet } from 'lucide-react';
import { backupApi } from '../api/backup';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { getErrorMessage } from '../utils/format';

export default function Backup() {
  const { t } = useTranslation();

  const translateSheetName = (sheet) => {
    const sheetNameLower = sheet.toLowerCase();
    const sheetMap = {
      users: t('backup.tableUsers'),
      user_financial_profiles: t('backup.tableFinancialProfile'),
      user_categories: t('backup.tableCategories'),
      cards: t('backup.tableCards'),
      goals: t('backup.tableGoals'),
      goal_options: t('backup.tableGoalOptions'),
      expenses: t('backup.tableExpenses'),
      expense_installment_payments: t('backup.tableInstallments'),

      usuario: t('backup.tableUsers'),
      'usuário': t('backup.tableUsers'),
      'usuários': t('backup.tableUsers'),
      'perfil financeiro': t('backup.tableFinancialProfile'),
      'categorias': t('backup.tableCategories'),
      'cartões': t('backup.tableCards'),
      'cartões disponíveis': t('backup.tableCards'),
      'metas': t('backup.tableGoals'),
      'opções de metas': t('backup.tableGoalOptions'),
      'despesas': t('backup.tableExpenses'),
      'histórico de parcelas': t('backup.tableInstallments'),
      'pagamento de parcelas': t('backup.tableInstallments'),
    };

    const translated = sheetMap[sheetNameLower];
    if (translated) {
      return translated;
    }
    return sheet;
  };

  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const response = await backupApi.downloadExpensesTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tapcash-modelo-despesas.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t('backup.templateSuccess'));
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDownloadingTemplate(false);
    }
  };


  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await backupApi.exportExcel();

      // Get filename from Content-Disposition header if possible, else default
      let filename = `tapcash-backup-${new Date().toISOString().split('T')[0]}.xlsx`;

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(t('backup.success'));
    } catch (error) {
      let errorMessage = getErrorMessage(error);
      if (!errorMessage) {
        errorMessage = t('backup.error');
      }
      toast.error(errorMessage);
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (!file.name.endsWith('.xlsx')) {
        toast.error(t('backup.invalidFormat'));
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error(t('backup.noFileSelected'));
      return;
    }

    const confirmMessage = t('backup.confirmImport');
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setImporting(true);
    setImportResult(null);
    try {
      const response = await backupApi.importExcel(selectedFile);
      setImportResult(response.data);
      toast.success(t('backup.success'));
      setSelectedFile(null);

      // Reset input element
      const fileInput = document.getElementById('backup-file-input');
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      let errorMessage = getErrorMessage(error);
      if (!errorMessage) {
        errorMessage = t('backup.error');
      }
      toast.error(errorMessage);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">

        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Database className="text-primary-500" size={28} />
          {t('backup.title')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('backup.subtitle')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Export Card */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-3 text-blue-600 dark:text-blue-400">
              <Download size={24} />
            </div>
            <div className="flex-1 space-y-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t('backup.exportSection')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('backup.exportDesc')}
              </p>
              <Button
                onClick={handleExport}
                loading={exporting}
                className="w-full sm:w-auto"
              >
                <FileSpreadsheet className="mr-2" size={18} />
                {t('backup.exportBtn')}
              </Button>
            </div>
          </div>
        </Card>

        {/* Template Card */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-3 text-purple-600 dark:text-purple-400">
              <FileSpreadsheet size={24} />
            </div>
            <div className="flex-1 space-y-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t('backup.templateSection')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('backup.templateDesc')}
              </p>
              <Button
                onClick={handleDownloadTemplate}
                loading={downloadingTemplate}
                className="w-full sm:w-auto"
                variant="secondary"
              >
                <Download className="mr-2" size={18} />
                {t('backup.downloadTemplateBtn')}
              </Button>
            </div>
          </div>
        </Card>


        {/* Import Card */}
        <Card className="hover:shadow-md transition-shadow">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3 text-emerald-600 dark:text-emerald-400">
              <Upload size={24} />
            </div>
            <div className="flex-1 space-y-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {t('backup.importSection')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('backup.importDesc')}
              </p>

              <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400">
                <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                <span className="text-xs leading-normal">
                  {t('backup.importWarning')}
                </span>
              </div>

              <form onSubmit={handleImport} className="space-y-4 pt-1">
                <div className="relative flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 dark:border-slate-700 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileSpreadsheet className="text-slate-400 mb-1" size={24} />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {selectedFile ? selectedFile.name : t('backup.selectFile')}
                      </p>
                    </div>
                    <input
                      id="backup-file-input"
                      type="file"
                      accept=".xlsx"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={importing}
                    />
                  </label>
                </div>

                <Button
                  type="submit"
                  loading={importing}
                  disabled={!selectedFile}
                  className="w-full"
                >
                  {importing ? t('backup.processing') : t('backup.importBtn')}
                </Button>
              </form>
            </div>
          </div>
        </Card>
      </div>

      {/* Import Result Table */}
      {importResult && (
        <Card className="animate-fadeIn">
          <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={20} />
            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
              {t('backup.summaryTitle')}
            </h3>
          </div>
          <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('backup.tableTab')}</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">{t('backup.tableImported')}</th>
                  <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">{t('backup.tableIgnored')}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">{t('backup.tableErrors')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-950">
                {Object.entries(importResult).map(([sheet, details]) => (
                  <tr key={sheet} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{translateSheetName(sheet)}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">{details.imported}</td>
                    <td className="px-4 py-3 text-right text-slate-500 dark:text-slate-400">{details.ignored}</td>
                    <td className="px-4 py-3 text-left">
                      {details.errors && details.errors.length > 0 ? (
                        <div className="text-red-500 flex items-center gap-1">
                          <AlertCircle size={14} />
                          <span className="text-xs">{details.errors.join(', ')}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

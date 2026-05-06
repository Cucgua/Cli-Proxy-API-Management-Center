import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useModelPricingStore, type ModelPricing } from '@/stores/useModelPricingStore';
import styles from './ModelPricingModal.module.scss';

interface ModelPricingModalProps {
  open: boolean;
  onClose: () => void;
}

function parsePrice(value: string): number {
  const num = parseFloat(value);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

function formatPrice(value: number): string {
  return Number.isFinite(value) ? value.toString() : '';
}

export function ModelPricingModal({ open, onClose }: ModelPricingModalProps) {
  const { t } = useTranslation();
  const { prices, globalDefault, setPrice, removePrice, setGlobalDefault } = useModelPricingStore();

  const [globalInput, setGlobalInput] = useState(formatPrice(globalDefault?.input ?? 0));
  const [globalOutput, setGlobalOutput] = useState(formatPrice(globalDefault?.output ?? 0));
  const [globalCached, setGlobalCached] = useState(formatPrice(globalDefault?.cached ?? 0));

  const [newModel, setNewModel] = useState('');
  const [newInput, setNewInput] = useState('');
  const [newOutput, setNewOutput] = useState('');
  const [newCached, setNewCached] = useState('');

  const sortedModels = useMemo(() => {
    return Object.keys(prices).sort((a, b) => a.localeCompare(b));
  }, [prices]);

  const handleSaveGlobal = () => {
    const pricing: ModelPricing = {
      input: parsePrice(globalInput),
      output: parsePrice(globalOutput),
      cached: parsePrice(globalCached),
    };
    if (pricing.input === 0 && pricing.output === 0 && pricing.cached === 0) {
      setGlobalDefault(null);
    } else {
      setGlobalDefault(pricing);
    }
  };

  const handleAdd = () => {
    const model = newModel.trim();
    if (!model) return;
    const pricing: ModelPricing = {
      input: parsePrice(newInput),
      output: parsePrice(newOutput),
      cached: parsePrice(newCached),
    };
    setPrice(model, pricing);
    setNewModel('');
    setNewInput('');
    setNewOutput('');
    setNewCached('');
  };

  const handleUpdate = (model: string, field: keyof ModelPricing, value: string) => {
    const existing = prices[model];
    if (!existing) return;
    setPrice(model, { ...existing, [field]: parsePrice(value) });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('monitor.pricing.title')}
      width={640}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      }
    >
      <div className={styles.pricingModal}>
        {/* 全局默认定价 */}
        <div>
          <div className={styles.sectionTitle}>{t('monitor.pricing.global_default')}</div>
          <div className={styles.globalPricingRow}>
            <Input
              label={t('monitor.pricing.input_price')}
              type="number"
              step="0.0001"
              min="0"
              value={globalInput}
              onChange={(e) => setGlobalInput(e.target.value)}
              onBlur={handleSaveGlobal}
              rightElement={<span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>$/M</span>}
            />
            <Input
              label={t('monitor.pricing.output_price')}
              type="number"
              step="0.0001"
              min="0"
              value={globalOutput}
              onChange={(e) => setGlobalOutput(e.target.value)}
              onBlur={handleSaveGlobal}
              rightElement={<span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>$/M</span>}
            />
            <Input
              label={t('monitor.pricing.cached_price')}
              type="number"
              step="0.0001"
              min="0"
              value={globalCached}
              onChange={(e) => setGlobalCached(e.target.value)}
              onBlur={handleSaveGlobal}
              rightElement={<span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>$/M</span>}
            />
          </div>
        </div>

        {/* 模型定价列表 */}
        <div>
          <div className={styles.sectionTitle}>{t('monitor.pricing.model_prices')}</div>
          <div className={styles.tableWrapper}>
            <table className={styles.pricingTable}>
              <thead>
                <tr>
                  <th>{t('monitor.pricing.model')}</th>
                  <th>{t('monitor.pricing.input_price')}</th>
                  <th>{t('monitor.pricing.output_price')}</th>
                  <th>{t('monitor.pricing.cached_price')}</th>
                  <th style={{ width: 60 }}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedModels.map((model) => (
                  <tr key={model}>
                    <td className={styles.modelCell} title={model}>
                      {model}
                    </td>
                    <td>
                      <input
                        className={styles.priceInput}
                        type="number"
                        step="0.0001"
                        min="0"
                        value={formatPrice(prices[model].input)}
                        onChange={(e) => handleUpdate(model, 'input', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.priceInput}
                        type="number"
                        step="0.0001"
                        min="0"
                        value={formatPrice(prices[model].output)}
                        onChange={(e) => handleUpdate(model, 'output', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.priceInput}
                        type="number"
                        step="0.0001"
                        min="0"
                        value={formatPrice(prices[model].cached)}
                        onChange={(e) => handleUpdate(model, 'cached', e.target.value)}
                      />
                    </td>
                    <td>
                      <button className={styles.deleteBtn} onClick={() => removePrice(model)}>
                        {t('common.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedModels.length === 0 && (
                  <tr>
                    <td colSpan={5} className={styles.emptyHint}>
                      {t('monitor.pricing.no_prices')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 添加新模型 */}
        <div>
          <div className={styles.sectionTitle}>{t('monitor.pricing.add_model')}</div>
          <div className={styles.addRow}>
            <Input
              placeholder={t('monitor.pricing.model_placeholder')}
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
              }}
            />
            <Input
              placeholder={t('monitor.pricing.input_placeholder')}
              type="number"
              step="0.0001"
              min="0"
              value={newInput}
              onChange={(e) => setNewInput(e.target.value)}
            />
            <Input
              placeholder={t('monitor.pricing.output_placeholder')}
              type="number"
              step="0.0001"
              min="0"
              value={newOutput}
              onChange={(e) => setNewOutput(e.target.value)}
            />
            <Input
              placeholder={t('monitor.pricing.cached_placeholder')}
              type="number"
              step="0.0001"
              min="0"
              value={newCached}
              onChange={(e) => setNewCached(e.target.value)}
            />
            <Button variant="secondary" size="sm" onClick={handleAdd}>
              {t('common.add')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

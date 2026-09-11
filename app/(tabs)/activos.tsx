import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import {
  createAssetWithSnapshot,
  createTransfer,
  deleteAsset,
  listAssetsWithLatestValue,
  listTransfers,
  updateAsset,
  upsertAssetSnapshot,
  type AssetType,
} from '@/db/queries/assets';
import { formatCents, parseAmountInput } from '@/lib/money';
import { getCurrentMonthKey } from '@/lib/month';
import { colors, radius, spacing, typography } from '@/theme/tokens';

const theme = colors.light;
const currentMonthKey = getCurrentMonthKey();
const todayIso = new Date().toISOString().slice(0, 10);

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'bank', label: 'Banco' },
  { value: 'investment', label: 'Inversión' },
  { value: 'crypto', label: 'Cripto' },
  { value: 'other', label: 'Otro' },
];

type AssetRow = Awaited<ReturnType<typeof listAssetsWithLatestValue>>[number];
type TransferRow = Awaited<ReturnType<typeof listTransfers>>[number];

function toAmountDraft(cents: number) {
  return formatCents(cents).replace(/[^\d.,]/g, '');
}

export default function Activos() {
  const [assets, setAssets] = useState<AssetRow[] | null>(null);
  const [transfers, setTransfers] = useState<TransferRow[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>('bank');
  const [value, setValue] = useState('');

  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<AssetType>('bank');
  const [editValue, setEditValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferFrom, setTransferFrom] = useState<number | null>(null);
  const [transferTo, setTransferTo] = useState<number | null>(null);
  const [transferAmount, setTransferAmount] = useState('');

  const reload = useCallback(() => {
    Promise.all([listAssetsWithLatestValue(), listTransfers()]).then(([a, t]) => {
      setAssets(a);
      setTransfers(t);
    });
  }, []);

  useFocusEffect(reload);

  async function handleAdd() {
    if (!name.trim() || !value.trim()) return;
    await createAssetWithSnapshot({ name: name.trim(), type, value: parseAmountInput(value), monthKey: currentMonthKey });
    setName('');
    setValue('');
    setShowForm(false);
    reload();
  }

  function startEdit(a: AssetRow) {
    setEditingId(a.id);
    setEditName(a.name);
    setEditType(a.type as AssetType);
    setEditValue(toAmountDraft(a.latestValue));
    setConfirmDeleteId(null);
  }

  async function saveEdit() {
    if (editingId == null || !editName.trim()) return;
    await updateAsset(editingId, { name: editName.trim(), type: editType });
    await upsertAssetSnapshot(editingId, currentMonthKey, parseAmountInput(editValue));
    setEditingId(null);
    reload();
  }

  async function handleDelete(id: number) {
    await deleteAsset(id);
    setEditingId(null);
    setConfirmDeleteId(null);
    reload();
  }

  async function handleTransfer() {
    if (transferFrom == null || transferTo == null || !transferAmount.trim()) return;
    const amount = parseAmountInput(transferAmount);
    if (amount <= 0) return;
    await createTransfer({ fromAssetId: transferFrom, toAssetId: transferTo, amount, date: todayIso, monthKey: currentMonthKey });
    setShowTransferForm(false);
    setTransferFrom(null);
    setTransferTo(null);
    setTransferAmount('');
    reload();
  }

  if (!assets) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <ActivityIndicator color={theme.accent} />
      </SafeAreaView>
    );
  }

  const total = assets.reduce((sum, a) => sum + a.latestValue, 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <View style={styles.pad}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Activos</Text>
          <Pressable
            onPress={() => {
              setEditMode((v) => !v);
              setEditingId(null);
              setConfirmDeleteId(null);
            }}
          >
            <Text style={[styles.editToggle, editMode && styles.editToggleActive]}>{editMode ? 'Listo' : 'Editar'}</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ gap: spacing.sm, paddingTop: spacing.md, paddingBottom: spacing.md }}>
          {assets.map((a) =>
            editingId === a.id ? (
              <Card key={a.id} style={{ gap: spacing.sm }}>
                <TextField label="Nombre" value={editName} onChangeText={setEditName} />
                <View style={styles.chipRow}>
                  {ASSET_TYPES.map((t) => (
                    <Chip key={t.value} label={t.label} selected={editType === t.value} onPress={() => setEditType(t.value)} />
                  ))}
                </View>
                <TextField label="Valor actual" value={editValue} onChangeText={setEditValue} suffix="€" keyboardType="decimal-pad" />
                <Button label="Guardar" onPress={saveEdit} />
                {confirmDeleteId === a.id ? (
                  <View style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>¿Borrar este activo?</Text>
                    <Pressable onPress={() => handleDelete(a.id)}>
                      <Text style={styles.confirmYes}>Sí, borrar</Text>
                    </Pressable>
                    <Pressable onPress={() => setConfirmDeleteId(null)}>
                      <Text style={styles.confirmNo}>Cancelar</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Button label="Eliminar activo" variant="ghost" onPress={() => setConfirmDeleteId(a.id)} />
                )}
              </Card>
            ) : (
              <View key={a.id} style={styles.assetRow}>
                {confirmDeleteId === a.id ? (
                  <>
                    <Text style={styles.confirmLabel}>¿Borrar {a.name}?</Text>
                    <Pressable onPress={() => handleDelete(a.id)}>
                      <Text style={styles.confirmYes}>Sí, borrar</Text>
                    </Pressable>
                    <Pressable onPress={() => setConfirmDeleteId(null)}>
                      <Text style={styles.confirmNo}>Cancelar</Text>
                    </Pressable>
                  </>
                ) : (
                  <Pressable style={styles.assetRowInner} onPress={() => editMode && startEdit(a)} disabled={!editMode}>
                    <View style={styles.assetIcon}>
                      <Text style={styles.assetIconLabel}>{a.name.slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <Text style={styles.assetName}>{a.name}</Text>
                    <Text style={styles.assetValue}>{formatCents(a.latestValue)}</Text>
                    {editMode && (
                      <Pressable style={styles.trashBtn} onPress={() => setConfirmDeleteId(a.id)}>
                        <View style={styles.trashIcon} />
                      </Pressable>
                    )}
                  </Pressable>
                )}
              </View>
            )
          )}

          {showForm ? (
            <Card style={{ gap: spacing.sm }}>
              <TextField label="Nombre" value={name} onChangeText={setName} placeholder="p. ej. Cuenta de ahorro" />
              <View style={styles.chipRow}>
                {ASSET_TYPES.map((t) => (
                  <Chip key={t.value} label={t.label} selected={type === t.value} onPress={() => setType(t.value)} />
                ))}
              </View>
              <TextField label="Valor actual" value={value} onChangeText={setValue} suffix="€" keyboardType="decimal-pad" />
              <Button label="Añadir" onPress={handleAdd} />
            </Card>
          ) : (
            <Button label="+ Añadir activo" variant="secondary" onPress={() => setShowForm(true)} />
          )}

          <View style={styles.totalStrip}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCents(total)}</Text>
          </View>

          <Button
            label="Cerrar mes"
            variant="secondary"
            onPress={() => router.push({ pathname: '/cierre-mensual', params: { monthKey: currentMonthKey } })}
          />

          <View style={styles.movRow}>
            <Text style={styles.sectionLabel}>Movimientos</Text>
            <Pressable onPress={() => setShowTransferForm((v) => !v)}>
              <Text style={styles.movNew}>{showTransferForm ? 'Cancelar' : '+ Nuevo'}</Text>
            </Pressable>
          </View>

          {showTransferForm && (
            <Card style={{ gap: spacing.sm }}>
              <Text style={styles.fieldLabel}>Desde</Text>
              <View style={styles.chipRow}>
                {assets.map((a) => (
                  <Chip key={a.id} label={a.name} selected={transferFrom === a.id} onPress={() => setTransferFrom(a.id)} />
                ))}
              </View>
              <Text style={styles.fieldLabel}>Hacia</Text>
              <View style={styles.chipRow}>
                {assets
                  .filter((a) => a.id !== transferFrom)
                  .map((a) => (
                    <Chip key={a.id} label={a.name} selected={transferTo === a.id} onPress={() => setTransferTo(a.id)} />
                  ))}
              </View>
              <TextField label="Importe" value={transferAmount} onChangeText={setTransferAmount} suffix="€" keyboardType="decimal-pad" />
              <Button label="Registrar movimiento" onPress={handleTransfer} />
            </Card>
          )}

          {transfers.length === 0 ? (
            <Text style={styles.emptyTransfers}>Sin movimientos todavía</Text>
          ) : (
            transfers.map((t) => (
              <View key={t.id} style={styles.transferRow}>
                <View style={styles.transferDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.transferName}>
                    {t.fromName} → {t.toName}
                  </Text>
                  <Text style={styles.transferDate}>{new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</Text>
                </View>
                <Text style={styles.transferAmount}>{formatCents(t.amount)}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { flex: 1, padding: spacing.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: typography.fontDisplay, fontSize: 22, fontWeight: '600', color: theme.textPrimary },
  editToggle: { fontFamily: typography.fontDisplay, fontSize: 13, fontWeight: '600', color: theme.textSecondary },
  editToggleActive: { color: theme.accent },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  assetRowInner: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  assetIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: theme.textPrimary, alignItems: 'center', justifyContent: 'center' },
  assetIconLabel: { fontFamily: typography.fontDisplay, fontWeight: '700', fontSize: 11, color: theme.background },
  assetName: { flex: 1, fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 13, color: theme.textPrimary },
  assetValue: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 14, color: theme.textPrimary },
  trashBtn: { width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(224,96,60,.1)', alignItems: 'center', justifyContent: 'center' },
  trashIcon: { width: 11, height: 13, borderWidth: 1.5, borderColor: theme.negative, borderTopWidth: 0, borderRadius: 2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  fieldLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontWeight: '600',
  },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: 4 },
  confirmLabel: { flex: 1, fontFamily: typography.fontDisplay, fontSize: 12.5, color: theme.textSecondary },
  confirmYes: { fontFamily: typography.fontDisplay, fontSize: 12.5, fontWeight: '600', color: theme.negative },
  confirmNo: { fontFamily: typography.fontDisplay, fontSize: 12.5, fontWeight: '600', color: theme.textMuted },
  totalStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: theme.textPrimary,
  },
  totalLabel: { fontFamily: typography.fontMono, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: theme.background, opacity: 0.6 },
  totalValue: { fontFamily: typography.fontDisplay, fontSize: 18, fontWeight: '600', color: theme.background },
  movRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  sectionLabel: {
    fontFamily: typography.fontMono,
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: theme.textMuted,
    fontWeight: '600',
  },
  movNew: { fontFamily: typography.fontDisplay, fontSize: 12.5, fontWeight: '600', color: theme.accent },
  emptyTransfers: { fontFamily: typography.fontDisplay, fontSize: 12.5, color: theme.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  transferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  transferDot: { width: 8, height: 8, borderRadius: 2, backgroundColor: theme.accent },
  transferName: { fontFamily: typography.fontDisplay, fontWeight: '600', fontSize: 12.5, color: theme.textPrimary },
  transferDate: { fontFamily: typography.fontDisplay, fontSize: 10.5, color: theme.textMuted, marginTop: 1 },
  transferAmount: { fontFamily: typography.fontMono, fontWeight: '600', fontSize: 12.5, color: theme.textPrimary },
});

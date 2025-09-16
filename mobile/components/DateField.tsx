import React from 'react';
import { Platform, View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity, Modal } from 'react-native';
import { Colors } from '../constants/Colors';
import CompatiblePicker from './CompatiblePicker';

interface DateFieldProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  containerStyle?: any;
  error?: string;
}

const pad = (n: number) => n.toString().padStart(2, '0');
const isValidYmd = (v?: string) => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v);

const DateField: React.FC<DateFieldProps> = ({ label, value, onChange, placeholder = 'YYYY-MM-DD', containerStyle, error }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, containerStyle]}>
        <Text style={styles.label}>{label}</Text>
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          style={styles.webInput as any}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </View>
    );
  }

  const today = new Date();
  const initial = isValidYmd(value) ? value! : `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const [y, m, d] = initial.split('-').map(Number);

  const [modalVisible, setModalVisible] = React.useState(false);
  const [year, setYear] = React.useState<number>(y);
  const [month, setMonth] = React.useState<number>(m);
  const [day, setDay] = React.useState<number>(d);

  const years = React.useMemo(() => {
    const arr: { label: string; value: string }[] = [];
    for (let yy = today.getFullYear(); yy >= 1900; yy--) {
      arr.push({ label: `${yy}`, value: `${yy}` });
    }
    return arr;
  }, [today]);

  const months = React.useMemo(() => Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}`, value: `${i + 1}` })), []);

  const daysInMonth = React.useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  const days = React.useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => ({ label: `${i + 1}`, value: `${i + 1}` })),
    [daysInMonth]
  );

  const currentLabel = isValidYmd(value) ? value : placeholder;

  const apply = () => {
    const ymd = `${year}-${pad(month)}-${pad(day)}`;
    onChange(ymd);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.pseudoInput} onPress={() => setModalVisible(true)}>
        <Text style={styles.pseudoInputText}>{currentLabel || placeholder}</Text>
      </TouchableOpacity>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner une date</Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.modalLabel}>Année</Text>
                <CompatiblePicker
                  selectedValue={`${year}`}
                  onValueChange={(v) => setYear(parseInt(v, 10) || year)}
                  items={years}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.modalLabel}>Mois</Text>
                <CompatiblePicker
                  selectedValue={`${month}`}
                  onValueChange={(v) => setMonth(parseInt(v, 10) || month)}
                  items={months}
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.modalLabel}>Jour</Text>
                <CompatiblePicker
                  selectedValue={`${Math.min(day, daysInMonth)}`}
                  onValueChange={(v) => setDay(parseInt(v, 10) || day)}
                  items={days}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnApply} onPress={apply}>
                <Text style={styles.btnApplyText}>Valider</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: Colors.darkGrey,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.gray?.light || '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    color: Colors.text || '#111827',
    fontSize: 16,
  },
  pseudoInput: {
    borderWidth: 1,
    borderColor: Colors.gray?.light || '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.white,
  },
  pseudoInputText: {
    fontSize: 16,
    color: Colors.text || '#111827',
  },
  webInput: {
    width: '100%',
    height: 44,
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    color: '#111827',
    fontSize: 16,
  },
  errorText: {
    marginTop: 6,
    color: '#dc2626',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '92%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 12,
    color: Colors.darkGrey,
    marginBottom: 6,
  },
  modalButtons: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  btnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: 8,
  },
  btnCancelText: {
    color: '#374151',
    fontSize: 16,
  },
  btnApply: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  btnApplyText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DateField;

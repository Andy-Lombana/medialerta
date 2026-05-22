import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  Modal,
  KeyboardAvoidingView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getDoctorProfiles,
  getCaregiverProfiles,
  DoctorProfile,
  CaregiverProfile,
} from "../../utils/storage";

interface MedicalReport {
  id: string;
  title: string;
  doctorName: string;
  caregiverName: string;
  date: string;
  time: string;
  notes: string;
}

export default function MedicalHistoryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"Reportes" | "Ver Reportes">("Reportes");
  const [reports, setReports] = useState<MedicalReport[]>([]);
  
  const [title, setTitle] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [selectedCaregiver, setSelectedCaregiver] = useState<CaregiverProfile | null>(null);
  const [date, setDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isDoctorModalVisible, setIsDoctorModalVisible] = useState(false);
  const [isCaregiverModalVisible, setIsCaregiverModalVisible] = useState(false);
  
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [caregivers, setCaregivers] = useState<CaregiverProfile[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [d, c, stored] = await Promise.all([
        getDoctorProfiles(),
        getCaregiverProfiles(),
        AsyncStorage.getItem("medical_reports")
      ]);
      setDoctors(d || []);
      setCaregivers(c || []);
      if (stored) setReports(JSON.parse(stored));
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  const handleSaveReport = async () => {
    if (!title.trim() || !selectedDoctor || !selectedCaregiver || !notes.trim()) {
      Alert.alert("Faltan datos", "Por favor completa todos los campos del reporte.");
      return;
    }

    const newReport: MedicalReport = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      doctorName: `${selectedDoctor.firstName} ${selectedDoctor.lastName}`,
      caregiverName: `${selectedCaregiver.firstName} ${selectedCaregiver.lastName}`,
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      notes,
    };

    try {
      const updatedReports = [newReport, ...reports];
      await AsyncStorage.setItem("medical_reports", JSON.stringify(updatedReports));
      setReports(updatedReports);
      
      setTitle("");
      setSelectedDoctor(null);
      setSelectedCaregiver(null);
      setDate(new Date());
      setNotes("");
      
      Alert.alert("Éxito", "Reporte guardado correctamente.");
      setActiveTab("Ver Reportes");
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el reporte.");
    }
  };

  const renderReportForm = () => (
    <View style={styles.form}>
      <Text style={styles.sectionTitle}>Nueva Consulta</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nombre consulta Medica"
        value={title}
        onChangeText={setTitle}
      />

      <TouchableOpacity style={styles.selector} onPress={() => setIsDoctorModalVisible(true)}>
        <Ionicons name="medical" size={20} color="#145269" />
        <Text style={[styles.selectorText, !selectedDoctor && styles.placeholderText]}>
          {selectedDoctor ? `Doctor: ${selectedDoctor.firstName} ${selectedDoctor.lastName}` : "Seleccionar Doctor"}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.selector} onPress={() => setIsCaregiverModalVisible(true)}>
        <Ionicons name="walk" size={20} color="#145269" />
        <Text style={[styles.selectorText, !selectedCaregiver && styles.placeholderText]}>
          {selectedCaregiver ? `Cuidador: ${selectedCaregiver.firstName} ${selectedCaregiver.lastName}` : "Seleccionar Cuidador"}
        </Text>
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>

      <View style={styles.row}>
        <TouchableOpacity style={[styles.input, styles.rowInput]} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar-outline" size={20} color="#145269" style={{ marginRight: 8 }} />
          <Text>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.input, styles.rowInput]} onPress={() => setShowTimePicker(true)}>
          <Ionicons name="time-outline" size={20} color="#145269" style={{ marginRight: 8 }} />
          <Text>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Informe de la consulta..."
        multiline
        numberOfLines={6}
        value={notes}
        onChangeText={setNotes}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSaveReport}>
        <Text style={styles.saveButtonText}>Guardar Reporte</Text>
      </TouchableOpacity>

      <Modal visible={isDoctorModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Doctor</Text>
            <ScrollView>
              {doctors.map((d) => (
                <TouchableOpacity key={d.id} style={styles.modalItem} onPress={() => { setSelectedDoctor(d); setIsDoctorModalVisible(false); }}>
                  <Text style={styles.modalItemText}>{d.firstName} {d.lastName}</Text>
                  <Text style={styles.modalSubText}>{d.clinic}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsDoctorModalVisible(false)}><Text>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isCaregiverModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Seleccionar Cuidador</Text>
            <ScrollView>
              {caregivers.map((c) => (
                <TouchableOpacity key={c.id} style={styles.modalItem} onPress={() => { setSelectedCaregiver(c); setIsCaregiverModalVisible(false); }}>
                  <Text style={styles.modalItemText}>{c.firstName} {c.lastName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsCaregiverModalVisible(false)}><Text>Cancelar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Corrección aplicada aquí: reemplazando onChange por onValueChange */}
      {showDatePicker && (
        <DateTimePicker 
          value={date} 
          mode="date" 
          display="default" 
          onValueChange={(d) => { setShowDatePicker(false); if (d) setDate(d); }} 
        />
      )}
      {showTimePicker && (
        <DateTimePicker 
          value={date} 
          mode="time" 
          is24Hour={false} 
          display="default" 
          onValueChange={(d) => { setShowTimePicker(false); if (d) setDate(d); }} 
        />
      )}
    </View>
  );

  const renderReportCards = () => (
    <View style={styles.cardsGrid}>
      {reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={64} color="#37889A" />
          <Text style={styles.emptyText}>No hay reportes registrados</Text>
        </View>
      ) : (
        reports.map((item) => (
          <View key={item.id} style={styles.reportCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.cardBadge}><Text style={styles.cardBadgeText}>{item.date}</Text></View>
            </View>
            <View style={styles.cardInfoRow}><Ionicons name="medical" size={16} color="#145269" /><Text style={styles.cardInfoText}>Dr. {item.doctorName}</Text></View>
            <View style={styles.cardInfoRow}><Ionicons name="walk" size={16} color="#145269" /><Text style={styles.cardInfoText}>Cuid. {item.caregiverName}</Text></View>
            <View style={styles.cardInfoRow}><Ionicons name="time-outline" size={16} color="#145269" /><Text style={styles.cardInfoText}>{item.time}</Text></View>
            <View style={styles.divider} />
            <Text style={styles.cardNotes}>{item.notes}</Text>
          </View>
        ))
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <LinearGradient colors={["#1A778E", "#145269"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="chevron-back" size={28} color="#145269" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Historia Médica</Text>
      </LinearGradient>
      <View style={styles.tabs}>
        {(["Reportes", "Ver Reportes"] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === "Reportes" ? renderReportForm() : renderReportCards()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", alignItems: "center" },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "white", justifyContent: "center", alignItems: "center", elevation: 3 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "white", marginLeft: 15 },
  tabs: { flexDirection: "row", backgroundColor: "white", padding: 5, margin: 20, borderRadius: 12, elevation: 2 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  activeTab: { backgroundColor: "#145269" },
  tabText: { fontWeight: "600", color: "#666" },
  activeTabText: { color: "white" },
  scrollContent: { padding: 20 },
  form: { backgroundColor: "white", borderRadius: 16, padding: 20, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 20 },
  input: { backgroundColor: "#f5f5f5", borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: "#e0e0e0", color: "#333" },
  selector: { backgroundColor: "#f5f5f5", borderRadius: 10, padding: 12, marginBottom: 15, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e0e0e0" },
  selectorText: { flex: 1, marginLeft: 10, fontSize: 16, color: "#333" },
  placeholderText: { color: "#999" },
  row: { flexDirection: "row", gap: 10 },
  rowInput: { flex: 1, flexDirection: "row", alignItems: "center" },
  textArea: { height: 120, textAlignVertical: "top" },
  saveButton: { backgroundColor: "#145269", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 10 },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  cardsGrid: { gap: 15 },
  reportCard: { backgroundColor: "white", borderRadius: 16, padding: 15, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardTitle: { fontSize: 18, fontWeight: "bold", color: "#333", flex: 1 },
  cardBadge: { backgroundColor: "#E3E7E8", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  cardBadgeText: { color: "#1A778E", fontSize: 12, fontWeight: "bold" },
  cardInfoRow: { flexDirection: "row", alignItems: "center", marginBottom: 5, gap: 8 },
  cardInfoText: { color: "#666", fontSize: 14 },
  divider: { height: 1, backgroundColor: "#eee", marginVertical: 10 },
  cardNotes: { fontSize: 14, color: "#444", lineHeight: 20 },
  emptyState: { alignItems: "center", paddingVertical: 50 },
  emptyText: { color: "#999", fontSize: 16, marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "white", borderRadius: 20, padding: 20, maxHeight: "80%" },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15, textAlign: "center" },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
  modalItemText: { fontSize: 16, color: "#333", fontWeight: "600" },
  modalSubText: { fontSize: 12, color: "#666" },
  closeButton: { marginTop: 15, padding: 15, alignItems: "center" },
});
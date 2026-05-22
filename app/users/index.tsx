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
import {
  getUserProfiles,
  saveUserProfiles,
  getCaregiverProfiles,
  saveCaregiverProfiles,
  getDoctorProfiles,
  saveDoctorProfiles,
  UserProfile,
  CaregiverProfile,
  DoctorProfile,
} from "../../utils/storage";

type UserType = "Usuario" | "Cuidador" | "Doctor" | "Usuarios";

// Definimos un estado inicial limpio para los formularios
const initialUserState: UserProfile = {
  id: "",
  firstName: "",
  lastName: "",
  phone: "",
  idCard: "",
  birthYear: "",
  birthDays: "",
  medicalHistory: "",
};

const initialCaregiverState: CaregiverProfile = {
  id: "",
  firstName: "",
  lastName: "",
  phone: "",
  idCard: "",
  startTime: "08:00",
  endTime: "18:00",
  daysOfWeek: [],
  is24Hours: false,
};

const initialDoctorState: DoctorProfile = {
  id: "",
  firstName: "",
  lastName: "",
  phone: "",
  clinic: "",
};

export default function UsersScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<UserType>("Usuario");
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [caregivers, setCaregivers] = useState<CaregiverProfile[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | CaregiverProfile | DoctorProfile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const [userForm, setUserForm] = useState<UserProfile>(initialUserState);
  const [caregiverForm, setCaregiverForm] = useState<CaregiverProfile>(initialCaregiverState);
  const [doctorForm, setDoctorForm] = useState<DoctorProfile>(initialDoctorState);

  useEffect(() => {
    loadAllProfiles();
  }, []);

  const loadAllProfiles = async () => {
    try {
      const [u, c, d] = await Promise.all([
        getUserProfiles(),
        getCaregiverProfiles(),
        getDoctorProfiles(),
      ]);
      // Nos super-aseguramos de que si llega un null/undefined, se guarde un arreglo vacío
      setUsers(u || []);
      setCaregivers(c || []);
      setDoctors(d || []);
    } catch (error) {
      console.error("Error cargando perfiles:", error);
      setUsers([]);
      setCaregivers([]);
      setDoctors([]);
    }
  };

const handleSave = async () => {
  if (activeTab === "Usuarios") return;

  try {
    const id = Math.random().toString(36).substr(2, 9);

    if (activeTab === "Usuario") {
      if (!userForm.firstName.trim()) {
        Alert.alert("Faltan datos", "El nombre es obligatorio.");
        return;
      }
      // 💡 VALIDACIÓN CRÍTICA: Si 'users' no es un arreglo por corrupción, empezamos con []
      const currentUsers = Array.isArray(users) ? users : [];
      const updated = [...currentUsers, { ...userForm, id }];
      
      await saveUserProfiles(updated);
      setUsers(updated);
      setUserForm(initialUserState);
    } 
    
    else if (activeTab === "Cuidador") {
      if (!caregiverForm.firstName.trim()) {
        Alert.alert("Faltan datos", "El nombre es obligatorio.");
        return;
      }
      // 💡 VALIDACIÓN CRÍTICA
      const currentCaregivers = Array.isArray(caregivers) ? caregivers : [];
      const updated = [...currentCaregivers, { ...caregiverForm, id }];
      
      await saveCaregiverProfiles(updated);
      setCaregivers(updated);
      setCaregiverForm(initialCaregiverState);
    } 
    
    else if (activeTab === "Doctor") {
      if (!doctorForm.firstName.trim()) {
        Alert.alert("Faltan datos", "El nombre es obligatorio.");
        return;
      }
      // 💡 VALIDACIÓN CRÍTICA
      const currentDoctors = Array.isArray(doctors) ? doctors : [];
      const updated = [...currentDoctors, { ...doctorForm, id }];
      
      await saveDoctorProfiles(updated);
      setDoctors(updated);
      setDoctorForm(initialDoctorState);
    }

    Alert.alert("Éxito", `Perfil de ${activeTab} guardado correctamente.`);
  } catch (error) {
    console.error("Error crítico al guardar perfil:", error);
    Alert.alert("Error", "No se pudo guardar la información de manera estable.");
  }
};

  const renderUserForm = () => (
    <View style={styles.form}>
      <Text style={styles.sectionTitle}>Datos del Adulto Mayor</Text>
      <TextInput style={styles.input} placeholder="Nombre" value={userForm.firstName} onChangeText={(t) => setUserForm({...userForm, firstName: t})} />
      <TextInput style={styles.input} placeholder="Apellido" value={userForm.lastName} onChangeText={(t) => setUserForm({...userForm, lastName: t})} />
      <TextInput style={styles.input} placeholder="Teléfono" keyboardType="phone-pad" value={userForm.phone} onChangeText={(t) => setUserForm({...userForm, phone: t})} />
      <TextInput style={styles.input} placeholder="Cédula" value={userForm.idCard} onChangeText={(t) => setUserForm({...userForm, idCard: t})} />
      <View style={styles.row}>
        <TextInput style={[styles.input, { flex: 1, marginRight: 10 }]} placeholder="Año de Nacimiento" keyboardType="numeric" value={userForm.birthYear} onChangeText={(t) => setUserForm({...userForm, birthYear: t})} />
        <TextInput style={[styles.input, { flex: 1 }]} placeholder="Días" keyboardType="numeric" value={userForm.birthDays} onChangeText={(t) => setUserForm({...userForm, birthDays: t})} />
      </View>
      <TextInput style={[styles.input, styles.textArea]} placeholder="Enfermedades base e historial médico" multiline numberOfLines={4} value={userForm.medicalHistory} onChangeText={(t) => setUserForm({...userForm, medicalHistory: t})} />
    </View>
  );

  const renderCaregiverForm = () => (
    <View style={styles.form}>
      <Text style={styles.sectionTitle}>Datos del Cuidador</Text>
      <TextInput style={styles.input} placeholder="Nombre" value={caregiverForm.firstName} onChangeText={(t) => setCaregiverForm({...caregiverForm, firstName: t})} />
      <TextInput style={styles.input} placeholder="Apellido" value={caregiverForm.lastName} onChangeText={(t) => setCaregiverForm({...caregiverForm, lastName: t})} />
      <TextInput style={styles.input} placeholder="Teléfono" keyboardType="phone-pad" value={caregiverForm.phone} onChangeText={(t) => setCaregiverForm({...caregiverForm, phone: t})} />
      <TextInput style={styles.input} placeholder="Cédula" value={caregiverForm.idCard} onChangeText={(t) => setCaregiverForm({...caregiverForm, idCard: t})} />
      
      <View style={styles.cardContainer}>
        <TouchableOpacity style={[styles.scheduleCard, caregiverForm.is24Hours && styles.selectedCard]} onPress={() => setCaregiverForm({...caregiverForm, is24Hours: true})}>
          <Ionicons name="infinite-outline" size={24} color={caregiverForm.is24Hours ? "white" : "#1a8e2d"} />
          <Text style={[styles.cardLabel, caregiverForm.is24Hours && styles.selectedCardLabel]}>Todos los días (24h)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.scheduleCard, !caregiverForm.is24Hours && styles.selectedCard]} onPress={() => setCaregiverForm({...caregiverForm, is24Hours: false})}>
          <Ionicons name="time-outline" size={24} color={!caregiverForm.is24Hours ? "white" : "#1a8e2d"} />
          <Text style={[styles.cardLabel, !caregiverForm.is24Hours && styles.selectedCardLabel]}>Horario Específico</Text>
        </TouchableOpacity>
      </View>

      {!caregiverForm.is24Hours && (
        <View style={styles.scheduleDetails}>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}><Text style={styles.label}>Inicio</Text><TextInput style={styles.input} value={caregiverForm.startTime} onChangeText={(t) => setCaregiverForm({...caregiverForm, startTime: t})} /></View>
            <View style={{ flex: 1 }}><Text style={styles.label}>Salida</Text><TextInput style={styles.input} value={caregiverForm.endTime} onChangeText={(t) => setCaregiverForm({...caregiverForm, endTime: t})} /></View>
          </View>
          <Text style={styles.label}>Días de la semana</Text>
          {/* Añadida protección para asegurar que daysOfWeek sea un array antes de hacer .join() */}
          <TextInput style={styles.input} placeholder="Ej: Lunes a Viernes" value={Array.isArray(caregiverForm.daysOfWeek) ? caregiverForm.daysOfWeek.join(", ") : ""} onChangeText={(t) => setCaregiverForm({...caregiverForm, daysOfWeek: t.split(",").map(s => s.trim())})} />
        </View>
      )}
    </View>
  );

  const renderDoctorForm = () => (
    <View style={styles.form}>
      <Text style={styles.sectionTitle}>Datos del Doctor</Text>
      <TextInput style={styles.input} placeholder="Nombre" value={doctorForm.firstName} onChangeText={(t) => setDoctorForm({...doctorForm, firstName: t})} />
      <TextInput style={styles.input} placeholder="Apellido" value={doctorForm.lastName} onChangeText={(t) => setDoctorForm({...doctorForm, lastName: t})} />
      <TextInput style={styles.input} placeholder="Teléfono" keyboardType="phone-pad" value={doctorForm.phone} onChangeText={(t) => setDoctorForm({...doctorForm, phone: t})} />
      <TextInput style={styles.input} placeholder="Clínica" value={doctorForm.clinic} onChangeText={(t) => setDoctorForm({...doctorForm, clinic: t})} />
    </View>
  );

  const renderUsuariosCards = () => {
    // 💡 PROTECCIÓN: Usamos "Array.isArray" y fallback "|| []" para garantizar que la app nunca se caiga aquí
    const safeUsers = Array.isArray(users) ? users.map(u => ({ ...u, type: "Usuario" })) : [];
    const safeCaregivers = Array.isArray(caregivers) ? caregivers.map(c => ({ ...c, type: "Cuidador" })) : [];
    const safeDoctors = Array.isArray(doctors) ? doctors.map(d => ({ ...d, type: "Doctor" })) : [];

    const all = [...safeUsers, ...safeCaregivers, ...safeDoctors];

    if (all.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No hay perfiles registrados</Text>
        </View>
      );
    }

    return (
      <View style={styles.cardsGrid}>
        {all.map((item, idx) => (
          <TouchableOpacity
            key={item.id || idx.toString()} // Es mejor usar el ID si existe
            style={styles.profileCard}
            onPress={() => {
              setSelectedProfile(item as any);
              setModalVisible(true);
            }}
          >
            <View style={styles.cardHeader}>
              <Ionicons 
                name={item.type === "Usuario" ? "person" : item.type === "Cuidador" ? "walk" : "medical"} 
                size={24} 
                color="#1a8e2d" 
              />
              <Text style={styles.cardBadge}>{item.type}</Text>
            </View>
            <Text style={styles.cardName}>{item.firstName} {item.lastName}</Text>
            <Text style={styles.cardPhone}>{item.phone}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <LinearGradient colors={["#1a8e2d", "#146922"]} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Ionicons name="chevron-back" size={28} color="white" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Perfiles de Usuario</Text>
      </LinearGradient>
      <View style={styles.tabs}>
        {(["Usuario", "Cuidador", "Doctor", "Usuarios"] as UserType[]).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === "Usuario" && renderUserForm()}
        {activeTab === "Cuidador" && renderCaregiverForm()}
        {activeTab === "Doctor" && renderDoctorForm()}
        {activeTab === "Usuarios" && renderUsuariosCards()}
        
        {activeTab !== "Usuarios" && (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Guardar Información</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.detailTitle}>Información del Perfil</Text>
              {selectedProfile && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Nombre Completo</Text>
                  <Text style={styles.detailValue}>{selectedProfile.firstName} {selectedProfile.lastName}</Text>
                  
                  <Text style={styles.detailLabel}>Teléfono</Text>
                  <Text style={styles.detailValue}>{selectedProfile.phone}</Text>

                  {"idCard" in selectedProfile && selectedProfile.idCard && (
                    <>
                      <Text style={styles.detailLabel}>Cédula</Text>
                      <Text style={styles.detailValue}>{selectedProfile.idCard}</Text>
                    </>
                  )}

                  {"clinic" in selectedProfile && (
                    <>
                      <Text style={styles.detailLabel}>Clínica</Text>
                      <Text style={styles.detailValue}>{selectedProfile.clinic}</Text>
                    </>
                  )}

                  {"medicalHistory" in selectedProfile && selectedProfile.medicalHistory && (
                    <>
                      <Text style={styles.detailLabel}>Historial Médico</Text>
                      <Text style={styles.detailValue}>{selectedProfile.medicalHistory}</Text>
                    </>
                  )}
                </View>
              )}
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButtonText}>Cerrar Detalle</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, flexDirection: "row", alignItems: "center" },
  backButton: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "white" },
  tabs: { flexDirection: "row", backgroundColor: "white", padding: 5, margin: 20, borderRadius: 12, elevation: 2 },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  activeTab: { backgroundColor: "#1a8e2d" },
  tabText: { fontWeight: "600", color: "#666" },
  activeTabText: { color: "white" },
  scrollContent: { padding: 20 },
  form: { backgroundColor: "white", borderRadius: 16, padding: 20, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 20 },
  input: { backgroundColor: "#f5f5f5", borderRadius: 10, padding: 12, marginBottom: 15, fontSize: 16, borderWidth: 1, borderColor: "#e0e0e0" },
  textArea: { height: 100, textAlignVertical: "top" },
  row: { flexDirection: "row", marginBottom: 5 },
  label: { fontSize: 14, fontWeight: "600", color: "#666", marginBottom: 5, marginLeft: 5 },
  cardContainer: { flexDirection: "row", gap: 10, marginBottom: 20 },
  scheduleCard: { flex: 1, backgroundColor: "white", borderRadius: 12, padding: 15, alignItems: "center", borderWidth: 1, borderColor: "#1a8e2d" },
  selectedCard: { backgroundColor: "#1a8e2d" },
  cardLabel: { fontSize: 12, fontWeight: "700", color: "#1a8e2d", marginTop: 8, textAlign: "center" },
  selectedCardLabel: { color: "white" },
  scheduleDetails: { marginTop: 10 },
  saveButton: { backgroundColor: "#1a8e2d", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 30, marginBottom: 50 },
  saveButtonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  cardsGrid: { gap: 15 },
  profileCard: { backgroundColor: "white", borderRadius: 16, padding: 15, elevation: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardBadge: { backgroundColor: "#e8f5e9", color: "#1a8e2d", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, fontSize: 12, fontWeight: "bold" },
  cardName: { fontSize: 18, fontWeight: "bold", color: "#333" },
  cardPhone: { fontSize: 14, color: "#666", marginTop: 5 },
  emptyState: { alignItems: "center", paddingVertical: 50 },
  emptyText: { color: "#999", fontSize: 16, marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { backgroundColor: "white", borderRadius: 24, padding: 25, width: "100%", maxHeight: "80%" },
  detailTitle: { fontSize: 22, fontWeight: "bold", color: "#1a8e2d", marginBottom: 20, textAlign: "center" },
  detailSection: { marginBottom: 20 },
  detailLabel: { fontSize: 12, fontWeight: "bold", color: "#999", textTransform: "uppercase", marginBottom: 5 },
  detailValue: { fontSize: 16, color: "#333", marginBottom: 15 },
  closeButton: { backgroundColor: "#f5f5f5", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 10 },
  closeButtonText: { color: "#333", fontWeight: "bold", fontSize: 16 },
});
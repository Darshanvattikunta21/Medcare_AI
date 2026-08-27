import React, { useEffect, useState } from "react";
import { fetchAddresses, addAddress, updateAddress, deleteAddress, type ProfileAddress } from "@medicare/api-client";
import { MobileScreen, Card } from "../../components/mobile-ui";
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert
} from "react-native";
import { useAuth } from "../../lib/use-auth";

export default function AddressesScreen() {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<ProfileAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ProfileAddress | null>(null);

  // Form states
  const [label, setLabel] = useState("");
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAddresses = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetchAddresses();
      setAddresses(res);
    } catch (err) {
      console.log("[AddressesScreen] Load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      loadAddresses();
    }, 0);
    return () => clearTimeout(t);
  }, [token]);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setLabel("Home");
    setLine1("");
    setCity("");
    setState("");
    setPinCode("");
    setFormError("");
    setShowModal(true);
  };

  const handleOpenEdit = (addr: ProfileAddress) => {
    setEditingAddress(addr);
    setLabel(addr.label);
    setLine1(addr.line1);
    setCity(addr.city);
    setState(addr.state);
    setPinCode(addr.pinCode);
    setFormError("");
    setShowModal(true);
  };

  const handleDelete = async (addrId: string) => {
    Alert.alert("Delete Address", "Are you sure you want to remove this delivery address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAddress(addrId);
            loadAddresses();
          } catch (err) {
            console.log("[Addresses] Delete failed:", err);
          }
        }
      }
    ]);
  };

  const validate = () => {
    if (!label.trim()) {
      setFormError("Address type label (e.g. Home, Office) is required.");
      return false;
    }
    if (!line1.trim()) {
      setFormError("Street address line 1 is required.");
      return false;
    }
    if (!city.trim()) {
      setFormError("City is required.");
      return false;
    }
    if (!state.trim()) {
      setFormError("State is required.");
      return false;
    }
    if (!/^[0-9]{6}$/.test(pinCode.trim())) {
      setFormError("Pincode must be exactly 6 digits.");
      return false;
    }
    setFormError("");
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSubmitting(true);

    const payload = {
      label: label.trim(),
      line1: line1.trim(),
      city: city.trim(),
      state: state.trim(),
      pinCode: pinCode.trim()
    };

    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, payload);
      } else {
        await addAddress(payload);
      }
      setShowModal(false);
      loadAddresses();
    } catch (err: any) {
      setFormError(err?.message || "Failed to save address details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MobileScreen activePath="/profile" title="My Addresses" subtitle="Manage your delivery drop locations">
      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable onPress={handleOpenAdd} style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add New Address</Text>
        </Pressable>

        {loading ? (
          <ActivityIndicator size="large" color="#1d9e75" style={{ marginVertical: 30 }} />
        ) : addresses.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No saved addresses found. Click above to add one.</Text>
          </Card>
        ) : (
          addresses.map((addr) => (
            <Card key={addr.id}>
              <View style={styles.addressCardRow}>
                <View style={styles.addressInfo}>
                  <Text style={styles.addressLabel}>{addr.label}</Text>
                  <Text style={styles.addressText}>{addr.line1}</Text>
                  <Text style={styles.addressText}>
                    {addr.city}, {addr.state} - {addr.pinCode}
                  </Text>
                </View>

                <View style={styles.addressActions}>
                  <Pressable onPress={() => handleOpenEdit(addr)} style={styles.actionBtn}>
                    <Text style={styles.actionTextBlue}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDelete(addr.id)} style={styles.actionBtn}>
                    <Text style={styles.actionTextRed}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal animationType="slide" transparent={true} visible={showModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingAddress ? "Edit Delivery Address" : "Add Delivery Address"}
            </Text>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.label}>Address Type Label (e.g. Home, Office, Work)</Text>
              <TextInput value={label} onChangeText={setLabel} placeholder="Home" style={styles.field} />

              <Text style={styles.label}>Street Address Line 1 *</Text>
              <TextInput value={line1} onChangeText={setLine1} placeholder="Flat, building, street no." style={styles.field} />

              <Text style={styles.label}>City *</Text>
              <TextInput value={city} onChangeText={setCity} placeholder="Bengaluru" style={styles.field} />

              <Text style={styles.label}>State *</Text>
              <TextInput value={state} onChangeText={setState} placeholder="Karnataka" style={styles.field} />

              <Text style={styles.label}>6-Digit Pincode *</Text>
              <TextInput
                keyboardType="number-pad"
                value={pinCode}
                onChangeText={setPinCode}
                placeholder="560001"
                style={styles.field}
              />

              {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable onPress={() => setShowModal(false)} style={[styles.btn, styles.cancelBtn]}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable disabled={submitting} onPress={handleSave} style={[styles.btn, styles.saveBtn]}>
                {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: 12,
    paddingBottom: 24
  },
  addBtn: {
    backgroundColor: "#eef9f4",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#1d9e75",
    borderRadius: 14,
    padding: 16,
    alignItems: "center"
  },
  addBtnText: {
    color: "#0f6e56",
    fontWeight: "700",
    fontSize: 14
  },
  emptyText: {
    color: "#6b7280",
    textAlign: "center",
    padding: 10
  },
  addressCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  addressInfo: {
    flex: 1,
    gap: 4
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827"
  },
  addressText: {
    fontSize: 13,
    color: "#4b5563"
  },
  addressActions: {
    flexDirection: "row",
    gap: 12
  },
  actionBtn: {
    padding: 8
  },
  actionTextBlue: {
    color: "#1d9e75",
    fontWeight: "700",
    fontSize: 13
  },
  actionTextRed: {
    color: "#ef4444",
    fontWeight: "700",
    fontSize: 13
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end"
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    padding: 20,
    gap: 16
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center"
  },
  modalScroll: {
    gap: 12,
    paddingBottom: 16
  },
  label: {
    fontWeight: "700",
    color: "#4b5563",
    fontSize: 12,
    marginBottom: 4,
    marginTop: 6
  },
  field: {
    borderWidth: 1,
    borderColor: "#d6e1dc",
    borderRadius: 12,
    backgroundColor: "#f9fafb",
    padding: 12,
    color: "#111827",
    fontSize: 14
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10
  },
  btn: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#ffffff"
  },
  saveBtn: {
    backgroundColor: "#1d9e75"
  },
  cancelBtnText: {
    color: "#4b5563",
    fontWeight: "700"
  },
  saveBtnText: {
    color: "#ffffff",
    fontWeight: "700"
  }
});

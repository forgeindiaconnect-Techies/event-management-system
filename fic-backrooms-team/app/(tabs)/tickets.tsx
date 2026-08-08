import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Alert, TouchableOpacity, ActivityIndicator, ScrollView, SafeAreaView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSession } from '../session';

const API_BASE_URL = 'https://event-management-system-y9fa.onrender.com/api';

export default function TicketsScreen() {
  const { session } = useSession();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [eventId, setEventId] = useState<string>('');
  const [verifiedTickets, setVerifiedTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  useEffect(() => {
    async function initData() {
      if (!session?.userId) return;
      try {
        // Universal endpoint — works for all team roles
        const res = await fetch(`${API_BASE_URL}/event-assignments/user/${session.userId}`, {
          headers: { Authorization: `Bearer ${session?.token}` },
        });
        if (res.ok) {
          const assignments = await res.json();
          if (assignments && assignments.length > 0 && assignments[0].eventId) {
            const firstEventId = assignments[0].eventId.toString();
            setEventId(firstEventId);
            fetchTickets(firstEventId);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    initData();
  }, [session]);

  const fetchTickets = async (eId: string) => {
    setLoadingTickets(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tickets/event/${eId}`, {
        headers: { 'Authorization': `Bearer ${session?.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const used = (data || []).filter((t: any) => t.status === "USED");
        setVerifiedTickets(used);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTickets(false);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3d2e9c" />
      </View>
    );
  }

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    Alert.alert(
      "Ticket Scanned",
      `QR Data: ${data}\n\nMark this ticket as USED?`,
      [
        {
          text: "Cancel",
          onPress: () => setScanned(false),
          style: "cancel"
        },
        { 
          text: "Confirm", 
          onPress: async () => {
            setIsProcessing(true);
            try {
              const res = await fetch(`${API_BASE_URL}/tickets/verify/${data}/staff/${session?.userId}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${session?.token}` }
              });
              
              if (res.ok) {
                const updatedTicket = await res.json();
                
                setVerifiedTickets(prev => {
                  if (prev.find(t => t.id === updatedTicket.id)) return prev;
                  return [updatedTicket, ...prev];
                });

                Alert.alert(
                  "Success", 
                  "Ticket verified and marked as USED!",
                  [{ text: "Scan Another", onPress: () => setScanned(false) }]
                );
              } else {
                const errorData = await res.json().catch(() => ({}));
                Alert.alert("Verification Failed", errorData.message || "Invalid ticket or already used.", [{ text: "OK", onPress: () => setScanned(false) }]);
              }
            } catch (err) {
              Alert.alert("Error", "A network error occurred while verifying.", [{ text: "OK", onPress: () => setScanned(false) }]);
            } finally {
              setIsProcessing(false);
            }
          } 
        }
      ]
    );
  };

  if (isCameraActive) {
    if (!permission.granted) {
      return (
        <SafeAreaView style={styles.container}>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, margin: 20 }} onPress={() => setIsCameraActive(false)}>
            <Ionicons name="arrow-back" size={24} color="#1e1b3d" />
            <Text style={{ fontSize: 16, color: '#1e1b3d', fontWeight: '600' }}>Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={styles.message}>We need your permission to use the camera for scanning tickets.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
              <Text style={styles.primaryBtnText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <View style={styles.container}>
        <CameraView 
          style={styles.camera} 
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        >
          <View style={styles.overlay}>
            <SafeAreaView>
              <TouchableOpacity style={styles.backBtn} onPress={() => setIsCameraActive(false)}>
                <Ionicons name="close" size={24} color="#ffffff" />
                <Text style={styles.backBtnText}>Stop Camera</Text>
              </TouchableOpacity>
            </SafeAreaView>
            
            <View style={styles.centerContainer}>
              <View style={styles.scanBox}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanText}>Position QR Code within the frame</Text>
              
              {isProcessing && (
                <View style={styles.processingBadge}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.processingText}>Verifying...</Text>
                </View>
              )}
            </View>
            
            <View style={{ height: 100 }} />
          </View>
        </CameraView>
      </View>
    );
  }

  // DEFAULT VIEW (Camera not active)
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }} onPress={() => router.push('/')}>
          <Ionicons name="arrow-back" size={24} color="#1e1b3d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket Verify</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.cameraActionCard}>
          <Ionicons name="scan-circle" size={48} color="#3d2e9c" style={{ marginBottom: 12 }} />
          <Text style={styles.cardTitle}>Live Scanner</Text>
          <Text style={styles.cardSubtitle}>Scan attendee QR codes to verify their tickets and check them in instantly.</Text>
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 20, width: '100%' }]} onPress={() => setIsCameraActive(true)}>
            <Ionicons name="camera" size={20} color="#ffffff" />
            <Text style={styles.primaryBtnText}>Start Camera</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Verified Tickets ({verifiedTickets.length})</Text>

        {loadingTickets ? (
          <ActivityIndicator size="large" color="#3d2e9c" style={{ marginTop: 20 }} />
        ) : verifiedTickets.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="ticket-outline" size={32} color="#9b9aab" style={{ marginBottom: 8 }} />
            <Text style={styles.emptyText}>No tickets verified yet.</Text>
          </View>
        ) : (
          verifiedTickets.map((ticket, i) => (
            <TouchableOpacity key={ticket.id || i} style={styles.ticketCard} onPress={() => setSelectedTicket(ticket)}>
              <View style={styles.ticketHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ticketNumber}>#{ticket.ticketNumber}</Text>
                  <Text style={styles.ticketName}>
                    {ticket.registration?.participant?.firstName || 'Unknown'} {ticket.registration?.participant?.lastName || ''}
                  </Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#15803d" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Ticket Details Modal */}
      <Modal visible={!!selectedTicket} transparent animationType="slide" onRequestClose={() => setSelectedTicket(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedTicket(null)}>
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ticket Details</Text>
              <TouchableOpacity onPress={() => setSelectedTicket(null)}>
                <Ionicons name="close" size={24} color="#1e1b3d" />
              </TouchableOpacity>
            </View>
            
            {selectedTicket && (
              <ScrollView style={{ padding: 20 }}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ticket Number</Text>
                  <Text style={styles.detailValue}>#{selectedTicket.ticketNumber}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Attendee Name</Text>
                  <Text style={styles.detailValue}>
                    {selectedTicket.registration?.participant?.firstName} {selectedTicket.registration?.participant?.lastName}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{selectedTicket.registration?.participant?.email || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Event</Text>
                  <Text style={styles.detailValue}>{selectedTicket.event?.eventName || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Registration Type</Text>
                  <Text style={styles.detailValue}>{selectedTicket.registration?.registrationType || 'N/A'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ticket Status</Text>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={16} color="#15803d" />
                    <Text style={styles.verifiedText}>{selectedTicket.status}</Text>
                  </View>
                </View>
                
                {selectedTicket.checkedInAt && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Checked In</Text>
                    <Text style={styles.detailValue}>{new Date(selectedTicket.checkedInAt).toLocaleString()}</Text>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7fc',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', paddingBottom: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eceaf3' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1e1b3d' },
  detailRow: { marginBottom: 16 },
  detailLabel: { fontSize: 13, color: '#68667a', marginBottom: 4, fontWeight: '600' },
  detailValue: { fontSize: 16, color: '#1e1b3d', fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eceaf3',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e1b3d',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  cameraActionCard: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eceaf3',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e1b3d',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#68667a',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e1b3d',
    marginBottom: 16,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eceaf3',
    borderStyle: 'dashed',
  },
  emptyText: {
    color: '#68667a',
    fontSize: 15,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eceaf3',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  ticketNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: '#68667a',
    marginBottom: 4,
  },
  ticketName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e1b3d',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  verifiedText: {
    color: '#15803d',
    fontSize: 12,
    fontWeight: '700',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3d2e9c',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 20,
    fontSize: 16,
    color: '#68667a',
    lineHeight: 24,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'space-between',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignSelf: 'flex-start',
    borderRadius: 20,
  },
  backBtnText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    marginRight: 4,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBox: {
    width: 260,
    height: 260,
    backgroundColor: 'transparent',
    position: 'relative',
    marginBottom: 20,
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4ade80',
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  processingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3d2e9c',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
    gap: 8,
  },
  processingText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  }
});

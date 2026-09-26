import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Share,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useMovieBooking } from '../context/MovieBookingContext';
import { getLocalMovieTickets, BookedMovieTicket } from '../services/movieApi';
import { useTheme } from '../context/ThemeContext';

export default function MovieTicketScreen() {
  const { colors, isDarkMode } = useTheme();
  const { confirmedTicket } = useMovieBooking();
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();

  const [ticket, setTicket] = useState<BookedMovieTicket | null>(confirmedTicket);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (!ticket) {
      (async () => {
        const list = await getLocalMovieTickets();
        if (ticketId) {
          const found = list.find((t) => t.ticketId === ticketId);
          if (found) setTicket(found);
          else if (list.length > 0) setTicket(list[0]);
        } else if (list.length > 0) {
          setTicket(list[0]);
        }
      })();
    }
  }, [ticketId]);

  const handleShare = async () => {
    if (!ticket) return;
    try {
      await Share.share({
        message: `🎬 Movie Ticket: ${ticket.movieTitle}\nTheater: ${ticket.theaterName} (${ticket.screenName})\nDate: ${ticket.date} at ${ticket.time}\nSeats: ${ticket.seats.join(', ')}\nBooking Ref: ${ticket.bookingRef}`,
      });
    } catch (err) {
      console.log('Share error:', err);
    }
  };

  const generateTicketHtml = (t: BookedMovieTicket) => {
    const seatCount = t.seats.length || 1;
    const convenienceFee = seatCount * 20.0;
    const gstFee = +(convenienceFee * 0.18).toFixed(2);
    const baseAmount = Math.max(0, Number(t.amount) - convenienceFee - gstFee);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      JSON.stringify({
        ticketId: t.ticketId,
        ref: t.bookingRef,
        movie: t.movieTitle,
        theater: t.theaterName,
        date: t.date,
        time: t.time,
        seats: t.seats,
      })
    )}`;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Movie Ticket - ${t.movieTitle}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
            body { background-color: #f1f5f9; padding: 32px 16px; color: #0f172a; }
            .ticket-card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }
            .ticket-header { background: linear-gradient(135deg, #7931ED 0%, #4F46E5 100%); color: #ffffff; padding: 24px; position: relative; }
            .badge-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
            .badge { background: rgba(255,255,255,0.22); padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
            .status-badge { background: #10B981; color: #FFF; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
            .movie-title { font-size: 26px; font-weight: 900; line-height: 1.2; margin-bottom: 6px; }
            .theater-sub { font-size: 14px; opacity: 0.95; font-weight: 600; }
            .ticket-body { padding: 24px; }
            .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
            .meta-box { background: #f8fafc; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; text-align: center; }
            .meta-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
            .meta-val { font-size: 14px; font-weight: 800; color: #0f172a; }
            .seats-highlight { color: #7931ED; font-size: 15px; }
            .perforation { display: flex; align-items: center; margin: 16px -24px; }
            .notch-left, .notch-right { width: 24px; height: 24px; background: #f1f5f9; border-radius: 50%; }
            .dashed-line { flex: 1; border-top: 2px dashed #cbd5e1; height: 1px; margin: 0 10px; }
            .qr-section { display: flex; align-items: center; justify-content: space-between; padding: 12px 0 20px; gap: 20px; }
            .qr-details { flex: 1; }
            .ref-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; }
            .ref-code { font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: 2px; margin: 4px 0 8px; }
            .ticket-prop { font-size: 12px; color: #475569; margin-top: 4px; }
            .qr-box { width: 140px; height: 140px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .qr-img { width: 100%; height: 100%; object-fit: contain; }
            .price-table { border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 8px; }
            .price-row { display: flex; justify-content: space-between; font-size: 13px; color: #64748b; margin-bottom: 6px; }
            .total-row { display: flex; justify-content: space-between; font-size: 17px; font-weight: 900; color: #0f172a; padding-top: 10px; border-top: 1px dashed #cbd5e1; margin-top: 6px; }
            .instructions { font-size: 11px; color: #64748b; line-height: 1.5; margin-top: 20px; background: #f8fafc; padding: 12px 16px; border-radius: 10px; border-left: 4px solid #7931ED; }
          </style>
        </head>
        <body>
          <div class="ticket-card">
            <div class="ticket-header">
              <div class="badge-row">
                <span class="badge">Cinema E-Ticket</span>
                <span class="status-badge">Confirmed</span>
              </div>
              <h1 class="movie-title">${t.movieTitle}</h1>
              <p class="theater-sub">${t.theaterName} • ${t.screenName}</p>
            </div>
            <div class="ticket-body">
              <div class="meta-grid">
                <div class="meta-box">
                  <div class="meta-label">Date</div>
                  <div class="meta-val">${t.date}</div>
                </div>
                <div class="meta-box">
                  <div class="meta-label">Time</div>
                  <div class="meta-val">${t.time}</div>
                </div>
                <div class="meta-box">
                  <div class="meta-label">Seats (${t.seats.length})</div>
                  <div class="meta-val seats-highlight">${t.seats.join(', ')}</div>
                </div>
              </div>

              <div class="perforation">
                <div class="notch-left"></div>
                <div class="dashed-line"></div>
                <div class="notch-right"></div>
              </div>

              <div class="qr-section">
                <div class="qr-details">
                  <div class="ref-label">Booking Reference</div>
                  <div class="ref-code">${t.bookingRef}</div>
                  <div class="ticket-prop">Ticket ID: <strong>${t.ticketId}</strong></div>
                  <div class="ticket-prop">Guest: <strong>${t.customerName}</strong> (${t.customerPhone})</div>
                  <div class="ticket-prop">Payment Mode: <strong>${t.paymentMode}</strong></div>
                </div>
                <div class="qr-box">
                  <img class="qr-img" src="${qrUrl}" alt="Ticket QR" />
                </div>
              </div>

              <div class="price-table">
                <div class="price-row">
                  <span>Base Tickets (${seatCount} seats)</span>
                  <span>₹${baseAmount.toFixed(2)}</span>
                </div>
                <div class="price-row">
                  <span>Convenience Fee (₹20 × ${seatCount})</span>
                  <span>₹${convenienceFee.toFixed(2)}</span>
                </div>
                <div class="price-row">
                  <span>Integrated GST (18% on fee)</span>
                  <span>₹${gstFee.toFixed(2)}</span>
                </div>
                <div class="total-row">
                  <span>Total Amount Paid</span>
                  <span style="color: #7931ED;">₹${Number(t.amount).toFixed(2)}</span>
                </div>
              </div>

              <div class="instructions">
                <strong>Admission Guidelines:</strong> Show this digital QR code at the cinema entry gate for instant contact-less verification. Please arrive at least 15 minutes before showtime.
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleDownloadPdf = async () => {
    if (!ticket) return;
    setIsDownloading(true);
    try {
      const html = generateTicketHtml(ticket);
      const { uri } = await Print.printToFileAsync({ html });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Download Ticket - ${ticket.movieTitle}`,
        });
      } else {
        Alert.alert('Download Complete', `Ticket PDF saved to:\n${uri}`);
      }
    } catch (err: any) {
      console.log('PDF generation error:', err);
      Alert.alert('Download Error', 'Could not create PDF: ' + (err.message || ''));
    } finally {
      setIsDownloading(false);
    }
  };

  if (!ticket) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.centerContainer}>
          <Ionicons name="ticket-outline" size={54} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Ticket Found</Text>
          <TouchableOpacity
            style={[styles.homeBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/home')}
          >
            <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const qrData = JSON.stringify({
    ticketId: ticket.ticketId,
    ref: ticket.bookingRef,
    movie: ticket.movieTitle,
    theater: ticket.theaterName,
    date: ticket.date,
    time: ticket.time,
    seats: ticket.seats,
  });

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace('/home')}
          style={[styles.headerBtn, { backgroundColor: colors.surface }]}
        >
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Booking Confirmed</Text>
        
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={handleDownloadPdf}
            disabled={isDownloading}
            style={[styles.headerBtn, { backgroundColor: colors.surface }]}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="download-outline" size={20} color={colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={[styles.headerBtn, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="share-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Success Icon */}
        <View style={styles.successBadgeWrap}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={28} color="#FFF" />
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>Enjoy the Show!</Text>
          <Text style={[styles.successSubtitle, { color: colors.textMuted }]}>
            Show this QR code at the cinema entry gate or download your PDF pass
          </Text>
        </View>

        {/* Perforated Cinema Ticket Card */}
        <View style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Movie Banner / Header */}
          <View style={styles.ticketTop}>
            <Image
              source={{
                uri: ticket.posterUrl || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80',
              }}
              style={styles.ticketPoster}
            />
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text numberOfLines={2} style={[styles.ticketMovieTitle, { color: colors.text }]}>
                {ticket.movieTitle}
              </Text>
              <Text style={[styles.ticketTheater, { color: colors.primary }]}>
                {ticket.theaterName}
              </Text>
              <Text style={[styles.ticketScreen, { color: colors.textMuted }]}>
                {ticket.screenName}
              </Text>
            </View>
          </View>

          {/* Details Row */}
          <View style={styles.ticketDetailsGrid}>
            <View style={styles.detailCell}>
              <Text style={[styles.cellLabel, { color: colors.textMuted }]}>DATE</Text>
              <Text style={[styles.cellValue, { color: colors.text }]}>{ticket.date}</Text>
            </View>
            <View style={styles.detailCell}>
              <Text style={[styles.cellLabel, { color: colors.textMuted }]}>TIME</Text>
              <Text style={[styles.cellValue, { color: colors.text }]}>{ticket.time}</Text>
            </View>
            <View style={styles.detailCell}>
              <Text style={[styles.cellLabel, { color: colors.textMuted }]}>SEATS</Text>
              <Text style={[styles.cellValueHighlight, { color: colors.primary }]}>
                {ticket.seats.join(', ')}
              </Text>
            </View>
          </View>

          {/* Perforated Notch Divider */}
          <View style={styles.perforationWrapper}>
            <View style={[styles.leftNotch, { backgroundColor: colors.background }]} />
            <View style={styles.dashedLine} />
            <View style={[styles.rightNotch, { backgroundColor: colors.background }]} />
          </View>

          {/* QR Code & Barcode Section */}
          <View style={styles.qrSection}>
            <View style={styles.qrContainer}>
              <QRCode value={qrData} size={150} color="#111827" backgroundColor="#FFFFFF" />
            </View>
            <Text style={[styles.ticketRef, { color: colors.text }]}>
              {ticket.bookingRef}
            </Text>
            <Text style={[styles.ticketIdText, { color: colors.textMuted }]}>
              Ticket ID: {ticket.ticketId}
            </Text>

            <View style={styles.attendeeRow}>
              <Text style={[styles.attendeeLabel, { color: colors.textMuted }]}>Booked for:</Text>
              <Text style={[styles.attendeeName, { color: colors.text }]}>
                {ticket.customerName} ({ticket.customerPhone})
              </Text>
            </View>
          </View>

          {/* Ticket Footer / Amount */}
          <View style={[styles.ticketFooter, { backgroundColor: isDarkMode ? '#262626' : '#F9FAFB' }]}>
            <Text style={[styles.footerPaidLabel, { color: colors.textMuted }]}>Amount Paid</Text>
            <Text style={[styles.footerPaidVal, { color: colors.primary }]}>
              ₹{Number(ticket.amount).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* PROMINENT DOWNLOAD TICKET PDF BUTTON */}
        <TouchableOpacity
          style={[styles.downloadPdfBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.88}
          disabled={isDownloading}
          onPress={handleDownloadPdf}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="document-text" size={20} color="#FFF" />
              <Text style={styles.downloadPdfBtnText}>Download Ticket in PDF</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.outlineBtn, { borderColor: colors.primary }]}
            onPress={() => router.push('/my-tickets')}
          >
            <Ionicons name="albums-outline" size={18} color={colors.primary} />
            <Text style={[styles.outlineBtnText, { color: colors.primary }]}>My Tickets</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.solidBtn, { backgroundColor: isDarkMode ? '#27272a' : '#e4e4e7' }]}
            onPress={() => router.replace('/home')}
          >
            <Ionicons name="home" size={18} color={colors.text} />
            <Text style={[styles.solidBtnText, { color: colors.text }]}>Home</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 16,
  },
  homeBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  successBadgeWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  checkCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  ticketCard: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  ticketTop: {
    flexDirection: 'row',
    padding: 16,
    gap: 14,
  },
  ticketPoster: {
    width: 80,
    height: 110,
    borderRadius: 10,
  },
  ticketMovieTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  ticketTheater: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  ticketScreen: {
    fontSize: 12,
  },
  ticketDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  detailCell: {
    alignItems: 'center',
  },
  cellLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  cellValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  cellValueHighlight: {
    fontSize: 15,
    fontWeight: '800',
  },
  perforationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  leftNotch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
  },
  dashedLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
  },
  rightNotch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: -12,
  },
  qrSection: {
    alignItems: 'center',
    padding: 20,
  },
  qrContainer: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  ticketRef: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  ticketIdText: {
    fontSize: 12,
    marginBottom: 12,
  },
  attendeeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  attendeeLabel: {
    fontSize: 12,
  },
  attendeeName: {
    fontSize: 12,
    fontWeight: '700',
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  footerPaidLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerPaidVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  downloadPdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  downloadPdfBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  solidBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  solidBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});

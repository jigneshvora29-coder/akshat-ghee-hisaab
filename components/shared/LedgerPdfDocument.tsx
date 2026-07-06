import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import type { Customer, Transaction, BusinessSettings } from "@/types";

// ─── Formatting Helpers ───────────────────────────────────────────────────────
const formatCurrency = (val: number | string | DecimalVal) => {
  const num = typeof val === "number" ? val : Number(val || 0);
  return "Rs. " + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateInput: Date | string) => {
  const d = new Date(dateInput);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

type DecimalVal = {
  toString: () => string;
};

interface LedgerPdfDocumentProps {
  customer: Customer;
  transactions: Transaction[];
  business?: BusinessSettings | null;
  dateRange?: { from: string; to: string } | null;
  calculatedOpeningBalance?: number;
}

// ─── StyleSheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    padding: 36,
    backgroundColor: "#FFFFFF",
    color: "#334155",
  },
  
  // Header Section
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#4F46E5", // Indigo Primary
    paddingBottom: 16,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#4F46E5", // Indigo
    justifyContent: "center",
    alignItems: "center",
  },
  logoPlaceholder: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    objectFit: "cover",
  },
  businessName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4F46E5", // Indigo
  },
  businessSub: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },
  headerRight: {
    textAlign: "right",
  },
  statementTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E293B",
  },
  statementDate: {
    fontSize: 9,
    color: "#64748B",
    marginTop: 4,
  },

  // Business & Customer Details Card
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 16,
  },
  infoCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#F8FAFC", // Very Light Gray
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#2B6CB0", // Muted Blue
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: 60,
    fontSize: 8.5,
    color: "#64748B",
    fontWeight: "bold",
  },
  infoValue: {
    flex: 1,
    fontSize: 9,
    color: "#1E293B",
  },

  // KPI Summary Cards
  summaryGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#FFFFFF",
  },
  summaryLabel: {
    fontSize: 8,
    color: "#64748B",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E293B",
  },
  summaryBadgeText: {
    fontSize: 7.5,
    color: "#64748B",
    marginTop: 2,
  },

  // Payment Status Alert Banner
  statusBanner: {
    borderRadius: 8,
    padding: 10,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "bold",
  },

  // Table
  table: {
    width: "100%",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#4F46E5", // Indigo
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  th: {
    color: "#FFFFFF",
    fontSize: 8.5,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  tableRowEven: {
    backgroundColor: "#FFFFFF",
  },
  tableRowOdd: {
    backgroundColor: "#F8FAFC", // Alternate row colors
  },
  td: {
    fontSize: 8.5,
  },
  textLeft: {
    textAlign: "left",
  },
  textRight: {
    textAlign: "right",
  },
  amountDebit: {
    color: "#4F46E5", // Indigo for Debit Sales
    fontWeight: "bold",
  },
  amountCredit: {
    color: "#059669", // Emerald for Credit Payments
    fontWeight: "bold",
  },
  
  // Table Columns Width
  colDate: { width: "15%" },
  colDesc: { width: "45%" },
  colDebit: { width: "13%", textAlign: "right" },
  colCredit: { width: "13%", textAlign: "right" },
  colBal: { width: "14%", textAlign: "right" },

  // Totals Row
  totalsRow: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF", // Light Indigo
    borderBottomWidth: 2,
    borderBottomColor: "#4F46E5",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  totalText: {
    fontSize: 9,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
  },

  // Payment Details Section
  paymentContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  paymentTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1E293B",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 4,
  },
  paymentGrid: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 40,
  },
  paymentColumn: {
    flex: 1,
  },
  paymentHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#334155",
    marginBottom: 4,
  },
  paymentText: {
    fontSize: 9,
    color: "#475569",
    marginBottom: 2,
  },

  // Footer Section
  footerContainer: {
    position: "absolute",
    bottom: 30,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#94A3B8",
  },
  pageNumber: {
    fontSize: 8,
    color: "#94A3B8",
  },
});

// ─── PDF Component ────────────────────────────────────────────────────────────
export function LedgerPdfDocument({ customer, transactions, business, dateRange, calculatedOpeningBalance }: LedgerPdfDocumentProps) {
  const openingBalance = calculatedOpeningBalance ?? Number(customer.openingBalance);
  
  // Ensure chronologically sorted transactions for correct running balance recalculation
  const sortedTxns = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Recalculate totals
  const totalDebit = sortedTxns
    .filter((t) => t.type === "SALE")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalCredit = sortedTxns
    .filter((t) => t.type === "PAYMENT")
    .reduce((s, t) => s + Number(t.amount), 0);
  
  // Calculate current outstanding based on the statement's opening balance and activity
  const currentOutstanding = openingBalance + totalDebit - totalCredit;
  const isFullyPaid = currentOutstanding <= 0;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* 1. HEADER */}
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            {business?.logoImage ? (
              <Image src={business.logoImage} style={styles.logoImage} />
            ) : (
              <View style={styles.logoContainer}>
                <Text style={styles.logoPlaceholder}>AG</Text>
              </View>
            )}
            <View>
              <Text style={styles.businessName}>{business?.businessName || "Akshat Ghee Agency"}</Text>
              <Text style={styles.businessSub}>{business?.ownerName || "Pure Cow Ghee Wholesale & Retail"}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.statementTitle}>Ledger Statement</Text>
            <Text style={styles.statementDate}>
              Generated: {new Date().toLocaleDateString("en-IN")} at {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        </View>

        {/* 2. INFORMATION GRID */}
        <View style={styles.infoGrid}>
          {/* Business details */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Business Info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{business?.phone || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>UPI ID:</Text>
              <Text style={styles.infoValue}>{business?.upiId || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>GSTIN:</Text>
              <Text style={styles.infoValue}>{business?.gstNumber || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>{business?.address || "—"}</Text>
            </View>
          </View>

          {/* Customer details */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Customer Info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{customer.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{customer.phone || "—"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>
                {[customer.village, customer.address].filter(Boolean).join(", ") || "—"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Period:</Text>
              <Text style={styles.infoValue}>
                {dateRange ? `${formatDate(dateRange.from)} - ${formatDate(dateRange.to)}` : "All Time"}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. KPI SUMMARY CARDS */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { borderLeftWidth: 3, borderLeftColor: "#4F46E5" }]}>
            <Text style={styles.summaryLabel}>Total Sales</Text>
            <Text style={[styles.summaryValue, { color: "#4F46E5" }]}>{formatCurrency(totalDebit)}</Text>
            <Text style={styles.summaryBadgeText}>Debit amount</Text>
          </View>

          <View style={[styles.summaryCard, { borderLeftWidth: 3, borderLeftColor: "#059669" }]}>
            <Text style={styles.summaryLabel}>Total Paid</Text>
            <Text style={[styles.summaryValue, { color: "#059669" }]}>{formatCurrency(totalCredit)}</Text>
            <Text style={styles.summaryBadgeText}>Collections credit</Text>
          </View>

          <View
            style={[
              styles.summaryCard,
              {
                borderLeftWidth: 3,
                borderLeftColor: isFullyPaid ? "#059669" : "#9333EA",
                backgroundColor: isFullyPaid ? "#ECFDF5" : "#FAF5FF",
              },
            ]}
          >
            <Text style={styles.summaryLabel}>{isFullyPaid ? "Credit Balance" : "Outstanding"}</Text>
            <Text style={[styles.summaryValue, { color: isFullyPaid ? "#059669" : "#7E22CE" }]}>
              {formatCurrency(Math.abs(currentOutstanding))}
            </Text>
            <Text style={styles.summaryBadgeText}>{isFullyPaid ? "Settled Account" : "Pending collection"}</Text>
          </View>
        </View>

        {/* 4. PAYMENT STATUS BANNER */}
        <View
          style={[
            styles.statusBanner,
            {
              backgroundColor: isFullyPaid ? "#ECFDF5" : "#FAF5FF",
              borderWidth: 1,
              borderColor: isFullyPaid ? "#A7F3D0" : "#E9D5FF",
            },
          ]}
        >
          <Text style={[styles.statusText, { color: isFullyPaid ? "#059669" : "#7E22CE" }]}>
            {isFullyPaid ? "★ FULLY PAID — Account has zero outstanding balance." : "⚠ PENDING PAYMENT — Account balance requires settlement."}
          </Text>
        </View>

        {/* 5. TABLE */}
        <View style={styles.table}>
          {/* Header Row */}
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colDate]}>Date</Text>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colDebit, styles.textRight]}>Debit (Sale)</Text>
            <Text style={[styles.th, styles.colCredit, styles.textRight]}>Credit (Paid)</Text>
            <Text style={[styles.th, styles.colBal, styles.textRight]}>Balance</Text>
          </View>

          {/* Opening Balance Row */}
          <View style={[styles.tableRow, styles.tableRowOdd]}>
            <Text style={[styles.td, styles.colDate, styles.textLeft]}>—</Text>
            <Text style={[styles.td, styles.colDesc, styles.textLeft, { fontWeight: "bold" }]}>Opening Balance</Text>
            <Text style={[styles.td, styles.colDebit, styles.textRight]}>—</Text>
            <Text style={[styles.td, styles.colCredit, styles.textRight]}>—</Text>
            <Text style={[styles.td, styles.colBal, styles.textRight, { fontWeight: "bold" }]}>
              {formatCurrency(openingBalance)}
            </Text>
          </View>

          {/* Transaction rows */}
          {sortedTxns.map((txn, index) => {
            const isRowOdd = index % 2 === 0;
            return (
              <View key={txn.id} style={[styles.tableRow, isRowOdd ? styles.tableRowEven : styles.tableRowOdd]}>
                <Text style={[styles.td, styles.colDate, styles.textLeft]}>{formatDate(txn.date)}</Text>
                <View style={[styles.td, styles.colDesc, styles.textLeft, { display: "flex", flexDirection: "column", gap: 2 }]}>
                  {txn.items && txn.items.length > 0 ? (
                    <>
                      <Text style={{ fontWeight: "bold" }}>Sale {txn.referenceNumber ? `[Ref: ${txn.referenceNumber}]` : ""}</Text>
                      {txn.items.map(item => (
                        <Text key={item.id} style={{ fontSize: 7, color: "#475569" }}>
                          • {item.item?.name || "Item"} — {Number(item.quantity)} {item.unit} @ {formatCurrency(Number(item.rate))} = {formatCurrency(Number(item.total))}
                        </Text>
                      ))}
                    </>
                  ) : (
                    <Text>
                      {txn.description} {txn.referenceNumber ? `[Ref: ${txn.referenceNumber}]` : ""}
                    </Text>
                  )}
                </View>
                <Text style={[styles.td, styles.colDebit, styles.textRight, styles.amountDebit]}>
                  {txn.type === "SALE" ? formatCurrency(txn.amount) : "—"}
                </Text>
                <Text style={[styles.td, styles.colCredit, styles.textRight, styles.amountCredit]}>
                  {txn.type === "PAYMENT"
                    ? formatCurrency(txn.amount)
                    : txn.type === "ADJUSTMENT"
                    ? `${formatCurrency(txn.amount)} (Adj)`
                    : "—"}
                </Text>
                <Text style={[styles.td, styles.colBal, styles.textRight, { fontWeight: "bold" }]}>
                  {formatCurrency(txn.runningBalance)}
                </Text>
              </View>
            );
          })}

          {/* Totals Row */}
          <View style={styles.totalsRow}>
            <Text style={[styles.colDate]}>—</Text>
            <Text style={[styles.colDesc, styles.totalText]}>TOTAL STATEMENT ACTIVITY</Text>
            <Text style={[styles.colDebit, styles.totalText, styles.textRight]}>{formatCurrency(totalDebit)}</Text>
            <Text style={[styles.colCredit, styles.totalText, styles.textRight]}>{formatCurrency(totalCredit)}</Text>
            <Text style={[styles.colBal, styles.totalText, styles.textRight]}>{formatCurrency(currentOutstanding)}</Text>
          </View>
        </View>

        {/* 5.5 PAYMENT DETAILS */}
        {(business?.bankName || business?.upiId) && (
          <View style={styles.paymentContainer} wrap={false}>
            <Text style={styles.paymentTitle}>Payment Instructions</Text>
            <View style={styles.paymentGrid}>
              {/* Bank Details */}
              {(business?.bankName || business?.bankAccount || business?.bankIfsc) && (
                <View style={styles.paymentColumn}>
                  <Text style={styles.paymentHeader}>Bank Transfer</Text>
                  {business?.bankName && <Text style={styles.paymentText}>Bank Name: {business.bankName}</Text>}
                  {business?.bankAccount && <Text style={styles.paymentText}>Account Number: {business.bankAccount}</Text>}
                  {business?.bankIfsc && <Text style={styles.paymentText}>IFSC Code: {business.bankIfsc}</Text>}
                </View>
              )}
              {/* UPI Details */}
              {business?.upiId && (
                <View style={[styles.paymentColumn, { borderLeftWidth: 1, borderLeftColor: "#E2E8F0", paddingLeft: 20 }]}>
                  <Text style={styles.paymentHeader}>UPI Payment</Text>
                  <Text style={styles.paymentText}>UPI ID: {business.upiId}</Text>
                  {business?.upiQrImage && (
                    <Image src={business.upiQrImage} style={{ width: 80, height: 80, marginTop: 6, objectFit: "contain" }} />
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* 6. FOOTER */}
        <View style={styles.footerContainer}>
          <View>
            <Text style={[styles.footerText, { fontStyle: "italic" }]}>
              {business?.footerMessage || "Thank you for choosing Akshat Ghee Agency."}
            </Text>
            <Text style={[styles.footerText, { marginTop: 2 }]}>
              For any queries please contact us at {business?.phone || "your number"}.
            </Text>
          </View>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { LedgerPdfDocument } from "@/components/shared/LedgerPdfDocument";
import React from "react";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Authenticate Request
  const session = await getSession(request);
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    // 2. Fetch Customer details & active transactions
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        transactions: {
          where: { isDeleted: false },
          orderBy: { date: "asc" },
          include: { items: { include: { item: true } } }
        },
      },
    });

    if (!customer) {
      return new NextResponse("Customer not found", { status: 404 });
    }

    // 3. Fetch Business Settings
    const settings = await prisma.businessSettings.findFirst();

    // 4. Extract Date range filters if provided in URL params
    const url = new URL(request.url);
    const fromStr = url.searchParams.get("from");
    const toStr = url.searchParams.get("to");
    const dateRange = fromStr && toStr ? { from: fromStr, to: toStr } : null;

    // Filter transactions by date range if specified
    let filteredTransactions = customer.transactions;
    let calculatedOpeningBalance = Number(customer.openingBalance || 0);

    if (dateRange) {
      const fromDate = new Date(dateRange.from);
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999); // Include entire end date

      // Calculate the sum of all transactions before the start date
      const pastTransactions = customer.transactions.filter(t => new Date(t.date) < fromDate);
      const pastSales = pastTransactions.filter(t => t.type === "SALE").reduce((sum, t) => sum + Number(t.amount), 0);
      const pastCredits = pastTransactions.filter(t => t.type !== "SALE").reduce((sum, t) => sum + Number(t.amount), 0);
      
      // The opening balance for this date range statement
      calculatedOpeningBalance = calculatedOpeningBalance + pastSales - pastCredits;

      // Filter transactions to only those within the date range
      filteredTransactions = customer.transactions.filter((t) => {
        const d = new Date(t.date);
        return d >= fromDate && d <= toDate;
      });
    }

    // 5. Render @react-pdf/renderer component to Node.js Buffer
    const docElement = React.createElement(LedgerPdfDocument, {
      customer: customer as any,
      transactions: filteredTransactions as any,
      business: settings as any,
      dateRange,
      calculatedOpeningBalance
    }) as React.ReactElement<any>;

    const pdfBuffer = await renderToBuffer(docElement);

    // 6. Return response with PDF headers
    const sanitizedCustomerName = customer.name.replace(/[^a-zA-Z0-9]/g, "_");
    const headers = new Headers();
    headers.set("Content-Type", "application/pdf");
    headers.set(
      "Content-Disposition",
      `inline; filename="ledger_${sanitizedCustomerName}.pdf"`
    );

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("PDF generation server error:", error);
    return new NextResponse("Internal Server Error during PDF compilation", {
      status: 500,
    });
  }
}

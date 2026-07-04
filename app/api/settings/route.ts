import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { businessSettingsSchema } from "@/lib/validations";
import { z } from "zod";



// GET /api/settings
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let settings = await prisma.businessSettings.findFirst();

  if (!settings) {
    settings = await prisma.businessSettings.create({
      data: {
        businessName: "Akshat Ghee",
        footerMessage: "Thank you for your business!",
      },
    });
  }

  return NextResponse.json({ data: settings });
}

// PATCH /api/settings
export async function PATCH(request: NextRequest) {
  const session = await getSession(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    // Handle logo/QR uploads separately (base64)
    const { logoImage, upiQrImage, ...rest } = body;
    const data = businessSettingsSchema.partial().parse(rest);

    let settings = await prisma.businessSettings.findFirst();

    // Validate image sizes (max 5MB base64 ≈ 6.7MB string)
    if (logoImage && logoImage.length > 7 * 1024 * 1024) {
      return NextResponse.json({ error: "Logo image too large (max 5MB)" }, { status: 400 });
    }
    if (upiQrImage && upiQrImage.length > 7 * 1024 * 1024) {
      return NextResponse.json({ error: "UPI QR image too large (max 5MB)" }, { status: 400 });
    }

    // Validate that images are actually images
    if (logoImage && !logoImage.startsWith("data:image/")) {
      return NextResponse.json({ error: "Logo must be an image" }, { status: 400 });
    }
    if (upiQrImage && !upiQrImage.startsWith("data:image/")) {
      return NextResponse.json({ error: "UPI QR must be an image" }, { status: 400 });
    }

    const updateData = {
      ...data,
      ...(logoImage !== undefined && { logoImage }),
      ...(upiQrImage !== undefined && { upiQrImage }),
    };

    if (settings) {
      settings = await prisma.businessSettings.update({
        where: { id: settings.id },
        data: updateData,
      });
    } else {
      settings = await prisma.businessSettings.create({
        data: {
          businessName: data.businessName || "Akshat Ghee",
          ...updateData,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        entity: "BusinessSettings",
        entityId: settings.id,
      },
    });

    return NextResponse.json({ data: settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

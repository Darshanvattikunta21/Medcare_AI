import { prisma } from "../lib/db";
import { notFound } from "../lib/errors";
import { asTrimmedString } from "../lib/validation";
import type { AddressRecord } from "../types";
import { ensureDatabaseSeeded, getCurrentUser } from "./database.service";

export async function listAddressesDb(userId?: string) {
  const user = await getCurrentUser(userId);
  if (!user) {
    return [];
  }

  return user.addresses;
}

export async function addAddressDb(payload: Partial<AddressRecord>, userId?: string) {
  await ensureDatabaseSeeded();
  const user = await getCurrentUser(userId);
  if (!user) {
    throw notFound("User not found");
  }

  return prisma.address.create({
    data: {
      userId: user.id,
      label: asTrimmedString(payload.label, "label") || "Saved",
      line1: asTrimmedString(payload.line1, "line1", { required: true, minLength: 5 }),
      city: asTrimmedString(payload.city, "city", { required: true, minLength: 2 }),
      state: asTrimmedString(payload.state, "state", { required: true, minLength: 2 }),
      pinCode: asTrimmedString(payload.pinCode, "pinCode", { required: true, minLength: 4 }),
      landmark: asTrimmedString(payload.landmark, "landmark") || null,
      instructions: asTrimmedString(payload.instructions, "instructions") || null
    }
  });
}

export async function updateAddressDb(addressId: string, payload: Partial<AddressRecord>, userId?: string) {
  await ensureDatabaseSeeded();
  const user = await getCurrentUser(userId);
  if (!user) {
    throw notFound("User not found");
  }

  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId: user.id }
  });

  if (!existing) {
    throw notFound("Address not found");
  }

  return prisma.address.update({
    where: { id: addressId },
    data: {
      label: asTrimmedString(payload.label, "label") || existing.label,
      line1: asTrimmedString(payload.line1, "line1") || existing.line1,
      city: asTrimmedString(payload.city, "city") || existing.city,
      state: asTrimmedString(payload.state, "state") || existing.state,
      pinCode: asTrimmedString(payload.pinCode, "pinCode") || existing.pinCode,
      landmark: asTrimmedString(payload.landmark, "landmark") || existing.landmark,
      instructions: asTrimmedString(payload.instructions, "instructions") || existing.instructions
    }
  });
}

export async function deleteAddressDb(addressId: string, userId?: string) {
  await ensureDatabaseSeeded();
  const user = await getCurrentUser(userId);
  if (!user) {
    throw notFound("User not found");
  }

  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId: user.id }
  });

  if (!existing) {
    throw notFound("Address not found");
  }

  await prisma.address.delete({
    where: { id: addressId }
  });

  return { ok: true };
}

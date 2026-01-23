// src/api/admin.js
import { requestJson } from "./http";

/* =========================
   KORISNICI
========================= */

export function listUsers() {
  return requestJson("/api/admin/users");
}

export function blockUser(userId) {
  return requestJson(`/api/admin/users/${userId}/block`, { method: "PATCH" });
}

export function unblockUser(userId) {
  return requestJson(`/api/admin/users/${userId}/unblock`, { method: "PATCH" });
}

/* =========================
   ODOBRAVANJE PROFILA
========================= */

export function listPendingProfiles() {
  return requestJson("/api/admin/pending-profiles");
}

export function approveProfile(profileId) {
  return requestJson(`/api/admin/profiles/${profileId}/approve`, { method: "PATCH" });
}

export function rejectProfile(profileId) {
  return requestJson(`/api/admin/profiles/${profileId}/reject`, { method: "PATCH" });
}

/* =========================
   CIJENE ČLANARINA
========================= */

export function getMembershipPricing() {
  return requestJson("/api/admin/membership-pricing");
}

export function updateMembershipPricing(data) {
  return requestJson("/api/admin/membership-pricing", { method: "PUT", data });
}

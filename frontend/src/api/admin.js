// src/api/admin.js
import { fetchJson } from "./fetchJson"; 
// ako ti je helper drugdje, prilagodi import

/* =========================
   KORISNICI
========================= */

export function listUsers() {
  return fetchJson("/admin/users");
}

export function blockUser(userId) {
  return fetchJson(`/admin/users/${userId}/block`, {
    method: "PATCH",
  });
}

export function unblockUser(userId) {
  return fetchJson(`/admin/users/${userId}/unblock`, {
    method: "PATCH",
  });
}

/* =========================
   ODOBRAVANJE PROFILA
========================= */

export function listPendingProfiles() {
  return fetchJson("/admin/pending-profiles");
}

export function approveProfile(profileId) {
  return fetchJson(`/admin/profiles/${profileId}/approve`, {
    method: "PATCH",
  });
}

export function rejectProfile(profileId) {
  return fetchJson(`/admin/profiles/${profileId}/reject`, {
    method: "PATCH",
  });
}

/* =========================
   CIJENE ČLANARINA
========================= */

export function getMembershipPricing() {
  return fetchJson("/admin/membership-pricing");
}

export function updateMembershipPricing(data) {
  return fetchJson("/admin/membership-pricing", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

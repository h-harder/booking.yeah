import { useState, useEffect, useRef, createContext, useContext } from "react";
import {
  Calendar, CalendarDays, ChevronLeft, ChevronRight, ChevronDown, Plus,
  Settings as SettingsIcon, Clock, User, Users, Check, X, Coffee, Scissors,
  Sparkles, Dumbbell, Stethoscope, Briefcase, LayoutGrid, Building2, Mail,
  Phone, MapPin, Globe, Palette, Database, Download, Upload, Trash2, Pencil,
  ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, XCircle, Save, ListChecks,
  Star, Info, RotateCcw, ClipboardList, BadgeCheck, CircleSlash
} from "lucide-react";

/* ============================== HELPERS ============================== */

function uid() {
  return "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function toHHMM(min) {
  const h = Math.floor(min / 60).toString().padStart(2, "0");
  const m = (min % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}
function rangesOverlap(aS, aE, bS, bE) {
  return aS < bE && bS < aE;
}
function formatTime12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return `${hh}:${m.toString().padStart(2, "0")} ${period}`;
}
function parseISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function formatDateLong(iso) {
  const d = parseISO(iso);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function formatMonthYear(date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function getMonthGrid(year, month) {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const start = addDays(firstOfMonth, -startOffset);
  const cells = [];
  for (let i = 0; i < 42; i++) cells.push(addDays(start, i));
  return cells;
}
function withAlpha(hex, alpha) {
  if (!hex) return "#52525B" + alpha;
  return hex + alpha;
}
function clampNum(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

const WEEKDAY_BY_INDEX = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
const DAY_SHORT = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };
const CURRENCY_SYMBOLS = { USD: "$", EUR: "€", GBP: "£", CAD: "$", AUD: "$", JPY: "¥" };

function makeHours(open, close, closedDays = []) {
  const obj = {};
  WEEKDAY_BY_INDEX.forEach((d) => {
    obj[d] = { open, close, closed: closedDays.includes(d) };
  });
  return obj;
}

/* ============================== PRESETS ============================== */

const PRESETS = {
  cafe: {
    id: "cafe", label: "Café & Restaurant", icon: Coffee, accent: "#B5562B",
    description: "Tables, walk-ins, and reservations by party size.",
    bookingNoun: "Reservation", bookingNounPlural: "Reservations",
    hours: makeHours("11:00", "22:00"),
    services: [
      { name: "Table for 2", duration: 90, price: 0, capacity: 6, staffRequired: false, trackGuests: true, color: "#B5562B", description: "Standard two-top reservation" },
      { name: "Table for 4", duration: 90, price: 0, capacity: 4, staffRequired: false, trackGuests: true, color: "#C9794A", description: "Reservation for a larger party" },
      { name: "Private Dining Room", duration: 120, price: 0, capacity: 1, staffRequired: false, trackGuests: true, color: "#7A3318", description: "Reserved room for groups and events" }
    ],
    staff: []
  },
  salon: {
    id: "salon", label: "Salon & Barber", icon: Scissors, accent: "#A6446B",
    description: "Stylist-based appointments with service menus.",
    bookingNoun: "Appointment", bookingNounPlural: "Appointments",
    hours: makeHours("09:00", "18:00", ["sun"]),
    services: [
      { name: "Haircut", duration: 30, price: 45, capacity: 1, staffRequired: true, color: "#A6446B" },
      { name: "Hair Color", duration: 90, price: 120, capacity: 1, staffRequired: true, color: "#C56A8E" },
      { name: "Blowout", duration: 30, price: 35, capacity: 1, staffRequired: true, color: "#7C3354" },
      { name: "Manicure", duration: 45, price: 30, capacity: 1, staffRequired: true, color: "#D98AA8" }
    ],
    staff: [
      { name: "Jordan Lee", role: "Senior Stylist", color: "#A6446B", serviceNames: ["Haircut", "Hair Color", "Blowout"] },
      { name: "Sam Rivera", role: "Nail Technician", color: "#D98AA8", serviceNames: ["Manicure"] }
    ]
  },
  spa: {
    id: "spa", label: "Spa & Wellness", icon: Sparkles, accent: "#4F7A63",
    description: "Therapist-based treatments and relaxation sessions.",
    bookingNoun: "Treatment", bookingNounPlural: "Treatments",
    hours: makeHours("09:00", "19:00"),
    services: [
      { name: "Swedish Massage", duration: 60, price: 95, capacity: 1, staffRequired: true, color: "#4F7A63" },
      { name: "Deep Tissue Massage", duration: 60, price: 110, capacity: 1, staffRequired: true, color: "#3D6350" },
      { name: "Facial", duration: 45, price: 85, capacity: 1, staffRequired: true, color: "#6B9A80" },
      { name: "Hot Stone Therapy", duration: 75, price: 130, capacity: 1, staffRequired: true, color: "#2E4F3F" }
    ],
    staff: [
      { name: "Avery Kim", role: "Massage Therapist", color: "#4F7A63", serviceNames: ["Swedish Massage", "Deep Tissue Massage", "Hot Stone Therapy"] },
      { name: "Riley Chen", role: "Esthetician", color: "#6B9A80", serviceNames: ["Facial"] }
    ]
  },
  fitness: {
    id: "fitness", label: "Fitness & Training", icon: Dumbbell, accent: "#C0571E",
    description: "Personal training sessions and group classes.",
    bookingNoun: "Session", bookingNounPlural: "Sessions",
    hours: makeHours("06:00", "21:00"),
    services: [
      { name: "Personal Training", duration: 60, price: 70, capacity: 1, staffRequired: true, color: "#C0571E" },
      { name: "Group HIIT Class", duration: 45, price: 20, capacity: 12, staffRequired: false, color: "#E0792F" },
      { name: "Yoga Class", duration: 60, price: 18, capacity: 15, staffRequired: false, color: "#9C4413" }
    ],
    staff: [
      { name: "Morgan Brooks", role: "Personal Trainer", color: "#C0571E", serviceNames: ["Personal Training"] },
      { name: "Casey Diaz", role: "Class Instructor", color: "#E0792F", serviceNames: ["Group HIIT Class", "Yoga Class"] }
    ]
  },
  medical: {
    id: "medical", label: "Medical & Clinic", icon: Stethoscope, accent: "#2C6E7F",
    description: "Provider-based patient appointments.",
    bookingNoun: "Appointment", bookingNounPlural: "Appointments",
    hours: makeHours("08:00", "17:00", ["sat", "sun"]),
    services: [
      { name: "New Patient Consultation", duration: 45, price: 150, capacity: 1, staffRequired: true, color: "#2C6E7F" },
      { name: "Follow-up Visit", duration: 20, price: 75, capacity: 1, staffRequired: true, color: "#3E8A9D" },
      { name: "Annual Checkup", duration: 30, price: 100, capacity: 1, staffRequired: true, color: "#1D4F5C" }
    ],
    staff: [
      { name: "Dr. Patel", role: "Physician", color: "#2C6E7F", serviceNames: ["New Patient Consultation", "Follow-up Visit", "Annual Checkup"] },
      { name: "Dr. Nguyen", role: "Physician", color: "#3E8A9D", serviceNames: ["New Patient Consultation", "Follow-up Visit", "Annual Checkup"] }
    ]
  },
  consulting: {
    id: "consulting", label: "Consulting & Professional", icon: Briefcase, accent: "#3F4F8C",
    description: "Client calls and meetings, weekday business hours.",
    bookingNoun: "Meeting", bookingNounPlural: "Meetings",
    hours: makeHours("09:00", "17:00", ["sat", "sun"]),
    services: [
      { name: "Discovery Call", duration: 30, price: 0, capacity: 1, staffRequired: true, color: "#3F4F8C" },
      { name: "Strategy Session", duration: 60, price: 200, capacity: 1, staffRequired: true, color: "#5A6BAE" },
      { name: "Project Review", duration: 45, price: 150, capacity: 1, staffRequired: true, color: "#2C3863" }
    ],
    staff: [
      { name: "Taylor Quinn", role: "Lead Consultant", color: "#3F4F8C", serviceNames: ["Discovery Call", "Strategy Session", "Project Review"] }
    ]
  },
  custom: {
    id: "custom", label: "Start from Scratch", icon: LayoutGrid, accent: "#52525B",
    description: "A blank slate — build your own services and hours.",
    bookingNoun: "Booking", bookingNounPlural: "Bookings",
    hours: makeHours("09:00", "17:00"),
    services: [
      { name: "General Appointment", duration: 30, price: 0, capacity: 1, staffRequired: false, color: "#52525B" }
    ],
    staff: []
  }
};

const ACCENT_SWATCHES = [
  { name: "Terracotta", value: "#B5562B" },
  { name: "Rose", value: "#A6446B" },
  { name: "Sage", value: "#4F7A63" },
  { name: "Amber", value: "#C0571E" },
  { name: "Teal", value: "#2C6E7F" },
  { name: "Indigo", value: "#3F4F8C" },
  { name: "Plum", value: "#6B3F6B" },
  { name: "Slate", value: "#52525B" },
  { name: "Crimson", value: "#9C3848" },
  { name: "Forest", value: "#2F5233" }
];

function buildPresetConfig(presetId, businessName) {
  const preset = PRESETS[presetId];
  const services = preset.services.map((s) => ({
    id: uid(), name: s.name, duration: s.duration, price: s.price,
    capacity: s.capacity, staffRequired: s.staffRequired, trackGuests: !!s.trackGuests,
    color: s.color, description: s.description || "", active: true
  }));
  const nameToId = Object.fromEntries(services.map((s) => [s.name, s.id]));
  const staff = preset.staff.map((st) => ({
    id: uid(), name: st.name, role: st.role, color: st.color || preset.accent, active: true,
    services: (st.serviceNames || []).map((n) => nameToId[n]).filter(Boolean)
  }));
  return {
    business: {
      name: businessName || preset.label, type: presetId, email: "", phone: "",
      address: "", website: "", currency: "USD", accentColor: preset.accent
    },
    hours: JSON.parse(JSON.stringify(preset.hours)),
    bookingRules: { slotInterval: 15, bufferTime: 0, minAdvanceHours: 1, maxAdvanceDays: 60, requireApproval: false, cancellationWindowHours: 24 },
    services, staff,
    terminology: { noun: preset.bookingNoun, nounPlural: preset.bookingNounPlural },
    setupComplete: false
  };
}

/* ============================== AVAILABILITY ============================== */

function getDayHours(config, dateObj) {
  const dayKey = WEEKDAY_BY_INDEX[dateObj.getDay()];
  return config.hours[dayKey];
}

function getAvailableSlots(config, bookings, dateISO, service, staffId, excludeId) {
  if (!service) return [];
  const dateObj = parseISO(dateISO);
  const dayHours = getDayHours(config, dateObj);
  if (!dayHours || dayHours.closed || !dayHours.open || !dayHours.close) return [];
  const openMin = toMinutes(dayHours.open);
  const closeMin = toMinutes(dayHours.close);
  const interval = Math.max(5, config.bookingRules.slotInterval || 15);
  const buffer = config.bookingRules.bufferTime || 0;
  const duration = service.duration;
  const now = new Date();
  const isToday = toISO(now) === dateISO;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const minAdvanceMin = (config.bookingRules.minAdvanceHours || 0) * 60;

  const relevantStaffIds = service.staffRequired
    ? (staffId ? [staffId] : config.staff.filter((s) => s.active !== false && s.services.includes(service.id)).map((s) => s.id))
    : [];

  const dayBookings = bookings.filter((b) => b.date === dateISO && b.status !== "cancelled" && b.id !== excludeId);

  const slots = [];
  for (let t = openMin; t + duration <= closeMin; t += interval) {
    if (isToday && t < nowMin + minAdvanceMin) continue;
    const cs = t, ce = t + duration;
    let ok;
    if (service.staffRequired) {
      if (relevantStaffIds.length === 0) {
        ok = false;
      } else {
        ok = relevantStaffIds.some((sid) => {
          const conflicts = dayBookings.filter((b) => b.staffId === sid);
          return !conflicts.some((b) => rangesOverlap(cs - buffer, ce + buffer, toMinutes(b.startTime), toMinutes(b.endTime)));
        });
      }
    } else {
      const sameService = dayBookings.filter((b) => b.serviceId === service.id);
      const overlapCount = sameService.filter((b) => rangesOverlap(cs, ce, toMinutes(b.startTime), toMinutes(b.endTime))).length;
      ok = overlapCount < (service.capacity || 1);
    }
    if (ok) slots.push(toHHMM(cs));
  }
  return slots;
}

function pickStaffForBooking(config, bookings, service, dateISO, startTime, excludeId) {
  const duration = service.duration;
  const buffer = config.bookingRules.bufferTime || 0;
  const cs = toMinutes(startTime), ce = cs + duration;
  const dayBookings = bookings.filter((b) => b.date === dateISO && b.status !== "cancelled" && b.id !== excludeId);
  const pool = config.staff.filter((s) => s.active !== false && s.services.includes(service.id));
  for (const s of pool) {
    const conflicts = dayBookings.filter((b) => b.staffId === s.id);
    const free = !conflicts.some((b) => rangesOverlap(cs - buffer, ce + buffer, toMinutes(b.startTime), toMinutes(b.endTime)));
    if (free) return s.id;
  }
  return null;
}

/* ============================== APP CONTEXT ============================== */

const AppCtx = createContext(null);
function useApp() {
  return useContext(AppCtx);
}

/* ============================== SMALL UI PIECES ============================== */

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
      style={{ backgroundColor: checked ? "var(--accent)" : "#D6D3CE" }}
      aria-pressed={checked}
      aria-label={label}
    >
      <span
        className="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(22px)" : "translateX(3px)" }}
      />
    </button>
  );
}

function ConfirmDialog({ open, title, message, confirmLabel = "Confirm", destructive = false, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-lg font-semibold text-stone-900 mb-2">{title}</h3>
        <p className="text-sm text-stone-600 mb-6 leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-100">
            Never mind
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: destructive ? "#B3261E" : "var(--accent)" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToastStack({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-[70] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-pop flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white max-w-xs"
          style={{ backgroundColor: t.type === "error" ? "#B3261E" : t.type === "info" ? "#292524" : "var(--accent)" }}
        >
          {t.type === "error" ? <XCircle size={16} className="shrink-0" /> : <CheckCircle2 size={16} className="shrink-0" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center gap-3 min-w-0">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-soft)" }}>
        <Icon size={18} style={{ color: "var(--accent)" }} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-display font-semibold text-stone-900 leading-none">{value}</div>
        <div className="text-xs text-stone-500 mt-1 truncate">{label}</div>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, message, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "var(--accent-soft)" }}>
        <Icon size={24} style={{ color: "var(--accent)" }} />
      </div>
      <h3 className="font-display text-lg font-semibold text-stone-900 mb-1">{title}</h3>
      <p className="text-sm text-stone-500 max-w-sm mb-5">{message}</p>
      {actionLabel && (
        <button onClick={onAction} className="btn-accent px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2">
          <Plus size={16} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    confirmed: { label: "Confirmed", bg: "#E6F4EA", fg: "#1E6B3A" },
    pending: { label: "Pending", bg: "#FCF1DC", fg: "#92660C" },
    cancelled: { label: "Cancelled", bg: "#F4F4F4", fg: "#78716C" }
  };
  const s = map[status] || map.confirmed;
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: s.bg, color: s.fg }}>
      {s.label}
    </span>
  );
}

/* ============================== TICKET / BOOKING DISPLAY ============================== */

function BookingTicket({ booking, onClick }) {
  const { config } = useApp();
  const service = config.services.find((s) => s.id === booking.serviceId);
  const staff = booking.staffId ? config.staff.find((s) => s.id === booking.staffId) : null;
  const color = service ? service.color : "#52525B";
  return (
    <button
      onClick={onClick}
      className="ticket w-full text-left bg-white rounded-xl border border-stone-200 hover:border-stone-300 hover:shadow-sm transition-all p-4 flex items-start gap-4"
      style={{ borderLeftColor: color, opacity: booking.status === "cancelled" ? 0.55 : 1 }}
    >
      <div className="text-center shrink-0 w-16">
        <div className="font-display text-base font-semibold text-stone-900">{formatTime12(booking.startTime).split(" ")[0]}</div>
        <div className="text-[11px] text-stone-400 uppercase tracking-wide">{formatTime12(booking.startTime).split(" ")[1]}</div>
      </div>
      <div className="w-px self-stretch bg-stone-150" style={{ borderLeft: "1px dashed #E7E5E0" }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-stone-900 truncate">{service ? service.name : "Service removed"}</span>
          <StatusBadge status={booking.status} />
        </div>
        <div className="text-sm text-stone-500 mt-0.5 truncate">
          {booking.customerName}
          {staff ? ` · with ${staff.name}` : ""}
          {booking.guestCount ? ` · ${booking.guestCount} guests` : ""}
        </div>
      </div>
      <div className="text-xs text-stone-400 shrink-0 self-center">{service ? service.duration + " min" : ""}</div>
    </button>
  );
}

function BookingDetailModal({ bookingId, onClose }) {
  const { config, bookings, currencySymbol, updateBooking, removeBooking, toast, terminology, navigateToEdit } = useApp();
  const [confirming, setConfirming] = useState(null);
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) return null;
  const service = config.services.find((s) => s.id === booking.serviceId);
  const staff = booking.staffId ? config.staff.find((s) => s.id === booking.staffId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-stone-400 font-semibold mb-1">{terminology.noun}</div>
            <h3 className="font-display text-xl font-semibold text-stone-900">{service ? service.name : "Service removed"}</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 p-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <StatusBadge status={booking.status} />
          {service && <span className="text-xs text-stone-400">{service.duration} min{service.price ? ` · ${currencySymbol}${service.price}` : ""}</span>}
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3 text-stone-700">
            <Calendar size={16} className="text-stone-400 shrink-0" />
            {formatDateLong(booking.date)}
          </div>
          <div className="flex items-center gap-3 text-stone-700">
            <Clock size={16} className="text-stone-400 shrink-0" />
            {formatTime12(booking.startTime)} – {formatTime12(booking.endTime)}
          </div>
          {staff && (
            <div className="flex items-center gap-3 text-stone-700">
              <User size={16} className="text-stone-400 shrink-0" />
              {staff.name}{staff.role ? ` · ${staff.role}` : ""}
            </div>
          )}
          {booking.guestCount ? (
            <div className="flex items-center gap-3 text-stone-700">
              <Users size={16} className="text-stone-400 shrink-0" />
              {booking.guestCount} guests
            </div>
          ) : null}
          <div className="h-px bg-stone-100 my-1" />
          <div>
            <div className="font-medium text-stone-900">{booking.customerName}</div>
            {booking.customerPhone && <div className="text-stone-500 flex items-center gap-2 mt-1"><Phone size={14} />{booking.customerPhone}</div>}
            {booking.customerEmail && <div className="text-stone-500 flex items-center gap-2 mt-1"><Mail size={14} />{booking.customerEmail}</div>}
          </div>
          {booking.notes && (
            <div className="bg-stone-50 rounded-lg p-3 text-stone-600 text-sm">{booking.notes}</div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {booking.status === "pending" && (
            <button
              onClick={() => { updateBooking(booking.id, { status: "confirmed" }); toast("Booking confirmed"); onClose(); }}
              className="btn-accent px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2"
            >
              <BadgeCheck size={16} /> Confirm
            </button>
          )}
          {booking.status !== "cancelled" && (
            <button
              onClick={() => { navigateToEdit(booking.id); onClose(); }}
              className="px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 border border-stone-200 text-stone-700 hover:bg-stone-50"
            >
              <Pencil size={16} /> Edit
            </button>
          )}
          {booking.status !== "cancelled" ? (
            <button
              onClick={() => setConfirming("cancel")}
              className="px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 border border-stone-200 text-stone-700 hover:bg-stone-50"
            >
              <CircleSlash size={16} /> Cancel booking
            </button>
          ) : null}
          <button
            onClick={() => setConfirming("delete")}
            className="px-3 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-2 text-red-600 hover:bg-red-50"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={!!confirming}
        title={confirming === "delete" ? "Delete this booking?" : "Cancel this booking?"}
        message={confirming === "delete" ? "This permanently removes the booking. This can't be undone." : "The time slot will be freed up for new bookings."}
        confirmLabel={confirming === "delete" ? "Delete" : "Cancel booking"}
        destructive
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          if (confirming === "delete") { removeBooking(booking.id); toast("Booking deleted"); }
          else { updateBooking(booking.id, { status: "cancelled" }); toast("Booking cancelled"); }
          setConfirming(null);
          onClose();
        }}
      />
    </div>
  );
}

/* ============================== SERVICES / STAFF EDITORS (shared) ============================== */

function ServicesEditor({ services, onChange, currencySymbol }) {
  const update = (id, patch) => onChange(services.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id) => onChange(services.filter((s) => s.id !== id));
  const add = () =>
    onChange([
      ...services,
      { id: uid(), name: "New Service", duration: 30, price: 0, capacity: 1, staffRequired: false, trackGuests: false, color: ACCENT_SWATCHES[services.length % ACCENT_SWATCHES.length].value, description: "", active: true }
    ]);

  return (
    <div className="space-y-3">
      {services.length === 0 && (
        <EmptyState icon={ListChecks} title="No services yet" message="Add the things people can book — a haircut, a table, a class." actionLabel="Add a service" onAction={add} />
      )}
      {services.map((s) => (
        <div key={s.id} className="bg-white rounded-2xl border border-stone-200 p-4" style={{ borderLeftWidth: 4, borderLeftColor: s.color }}>
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <label className="field-label">Name</label>
              <input className="field-input" value={s.name} onChange={(e) => update(s.id, { name: e.target.value })} />
            </div>
            <div className="w-28">
              <label className="field-label">Duration (min)</label>
              <input type="number" min={5} step={5} className="field-input" value={s.duration} onChange={(e) => update(s.id, { duration: clampNum(Number(e.target.value) || 5, 5, 600) })} />
            </div>
            <div className="w-28">
              <label className="field-label">Price ({currencySymbol})</label>
              <input type="number" min={0} className="field-input" value={s.price} onChange={(e) => update(s.id, { price: Math.max(0, Number(e.target.value) || 0) })} />
            </div>
            {!s.staffRequired && (
              <div className="w-32">
                <label className="field-label">Capacity / slot</label>
                <input type="number" min={1} className="field-input" value={s.capacity} onChange={(e) => update(s.id, { capacity: clampNum(Number(e.target.value) || 1, 1, 999) })} />
              </div>
            )}
          </div>

          <textarea
            className="field-input mt-3 resize-none"
            rows={2}
            placeholder="Short description (optional)"
            value={s.description}
            onChange={(e) => update(s.id, { description: e.target.value })}
          />

          <div className="flex items-center flex-wrap gap-6 mt-3">
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <Toggle checked={s.staffRequired} onChange={(v) => update(s.id, { staffRequired: v })} label="Requires a staff member" />
              Requires a team member
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <Toggle checked={s.trackGuests} onChange={(v) => update(s.id, { trackGuests: v })} label="Track guest count" />
              Ask for guest count
            </label>
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <Toggle checked={s.active !== false} onChange={(v) => update(s.id, { active: v })} label="Active" />
              Bookable
            </label>
            <div className="flex items-center gap-1.5 ml-auto">
              {ACCENT_SWATCHES.slice(0, 8).map((c) => (
                <button
                  key={c.value}
                  onClick={() => update(s.id, { color: c.value })}
                  className="w-5 h-5 rounded-full ring-offset-1"
                  style={{ backgroundColor: c.value, boxShadow: s.color === c.value ? `0 0 0 2px white, 0 0 0 3.5px ${c.value}` : "none" }}
                  aria-label={c.name}
                />
              ))}
            </div>
            <button onClick={() => remove(s.id)} className="text-red-500 hover:text-red-700 p-1.5" aria-label="Delete service">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      {services.length > 0 && (
        <button onClick={add} className="w-full border border-dashed border-stone-300 text-stone-500 hover:text-stone-700 hover:border-stone-400 rounded-2xl py-3 text-sm font-medium inline-flex items-center justify-center gap-2">
          <Plus size={16} /> Add a service
        </button>
      )}
    </div>
  );
}

function StaffEditor({ staff, services, onChange }) {
  const update = (id, patch) => onChange(staff.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const remove = (id) => onChange(staff.filter((s) => s.id !== id));
  const add = () =>
    onChange([...staff, { id: uid(), name: "New Team Member", role: "", color: ACCENT_SWATCHES[staff.length % ACCENT_SWATCHES.length].value, active: true, services: [] }]);
  const toggleService = (staffId, serviceId) => {
    const member = staff.find((s) => s.id === staffId);
    const has = member.services.includes(serviceId);
    update(staffId, { services: has ? member.services.filter((id) => id !== serviceId) : [...member.services, serviceId] });
  };

  const staffRequiredServices = services.filter((s) => s.staffRequired);

  return (
    <div className="space-y-3">
      {staffRequiredServices.length === 0 && (
        <div className="flex items-start gap-2 bg-amber-50 text-amber-800 rounded-xl p-3 text-sm mb-2">
          <Info size={16} className="shrink-0 mt-0.5" />
          No services currently require a team member. Add staff here, then turn on "Requires a team member" for a service.
        </div>
      )}
      {staff.length === 0 && (
        <EmptyState icon={Users} title="No team members yet" message="Add the people who provide your services." actionLabel="Add a team member" onAction={add} />
      )}
      {staff.map((member) => (
        <div key={member.id} className="bg-white rounded-2xl border border-stone-200 p-4" style={{ borderLeftWidth: 4, borderLeftColor: member.color }}>
          <div className="flex items-start gap-3 flex-wrap">
            <div className="flex-1 min-w-[160px]">
              <label className="field-label">Name</label>
              <input className="field-input" value={member.name} onChange={(e) => update(member.id, { name: e.target.value })} />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="field-label">Role / title</label>
              <input className="field-input" value={member.role} onChange={(e) => update(member.id, { role: e.target.value })} />
            </div>
          </div>
          <div className="mt-3">
            <label className="field-label">Offers</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {services.map((sv) => (
                <button
                  key={sv.id}
                  onClick={() => toggleService(member.id, sv.id)}
                  className="text-xs px-2.5 py-1 rounded-full border font-medium transition-colors"
                  style={
                    member.services.includes(sv.id)
                      ? { backgroundColor: withAlpha(sv.color, "22"), borderColor: sv.color, color: sv.color }
                      : { borderColor: "#E7E5E0", color: "#78716C" }
                  }
                >
                  {sv.name}
                </button>
              ))}
              {services.length === 0 && <span className="text-xs text-stone-400">Add services first</span>}
            </div>
          </div>
          <div className="flex items-center gap-6 mt-3">
            <label className="flex items-center gap-2 text-sm text-stone-600">
              <Toggle checked={member.active !== false} onChange={(v) => update(member.id, { active: v })} label="Active" />
              Active
            </label>
            <div className="flex items-center gap-1.5">
              {ACCENT_SWATCHES.slice(0, 8).map((c) => (
                <button
                  key={c.value}
                  onClick={() => update(member.id, { color: c.value })}
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: c.value, boxShadow: member.color === c.value ? `0 0 0 2px white, 0 0 0 3.5px ${c.value}` : "none" }}
                  aria-label={c.name}
                />
              ))}
            </div>
            <button onClick={() => remove(member.id)} className="text-red-500 hover:text-red-700 p-1.5 ml-auto" aria-label="Remove team member">
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
      {staff.length > 0 && (
        <button onClick={add} className="w-full border border-dashed border-stone-300 text-stone-500 hover:text-stone-700 hover:border-stone-400 rounded-2xl py-3 text-sm font-medium inline-flex items-center justify-center gap-2">
          <Plus size={16} /> Add a team member
        </button>
      )}
    </div>
  );
}

function HoursEditor({ hours, onChange }) {
  const update = (day, patch) => onChange({ ...hours, [day]: { ...hours[day], ...patch } });
  const applyToAll = (day) => {
    const src = hours[day];
    const next = {};
    DAY_ORDER.forEach((d) => (next[d] = { ...src }));
    onChange(next);
  };
  return (
    <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100">
      {DAY_ORDER.map((day) => (
        <div key={day} className="flex items-center gap-3 p-3.5 flex-wrap">
          <div className="w-28 font-medium text-sm text-stone-800 shrink-0">{DAY_LABELS[day]}</div>
          <Toggle checked={!hours[day].closed} onChange={(v) => update(day, { closed: !v })} label={`${day} open`} />
          {!hours[day].closed ? (
            <>
              <input type="time" className="field-input w-32" value={hours[day].open} onChange={(e) => update(day, { open: e.target.value })} />
              <span className="text-stone-400 text-sm">to</span>
              <input type="time" className="field-input w-32" value={hours[day].close} onChange={(e) => update(day, { close: e.target.value })} />
              <button onClick={() => applyToAll(day)} className="text-xs text-stone-400 hover:text-stone-700 ml-auto underline decoration-dotted">
                Copy to all days
              </button>
            </>
          ) : (
            <span className="text-sm text-stone-400 ml-1">Closed</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ============================== SETUP WIZARD ============================== */

const WIZARD_STEPS = ["Business", "Contact", "Hours", "Services & Team", "Branding"];

function SetupWizard() {
  const { setConfig, toast, existingConfig } = useApp();
  const [step, setStep] = useState(1);
  const [presetId, setPresetId] = useState(existingConfig ? existingConfig.business.type : null);
  const [businessName, setBusinessName] = useState(existingConfig ? existingConfig.business.name : "");
  const [draft, setDraft] = useState(existingConfig || null);

  const choosePreset = (id) => {
    setPresetId(id);
    if (!businessName) setBusinessName(PRESETS[id].label);
  };

  const goToStep2 = () => {
    if (!presetId || !businessName.trim()) return;
    const built = buildPresetConfig(presetId, businessName.trim());
    setDraft(built);
    setStep(2);
  };

  const finish = () => {
    setConfig({ ...draft, setupComplete: true });
    toast("All set — your booking page is ready");
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4" style={{ backgroundColor: "#FAF8F4" }}>
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3" style={{ backgroundColor: "var(--accent-soft)" }}>
            <CalendarDays size={22} style={{ color: "var(--accent)" }} />
          </div>
          <h1 className="font-display text-2xl font-semibold text-stone-900">Let's set up your booking page</h1>
          <p className="text-stone-500 text-sm mt-1">Five quick steps. Everything here can be changed later in Settings.</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center mb-8">
          {WIZARD_STEPS.map((label, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                    style={
                      done || active
                        ? { backgroundColor: "var(--accent)", color: "white" }
                        : { backgroundColor: "#EFEDE8", color: "#A8A29E" }
                    }
                  >
                    {done ? <Check size={14} /> : n}
                  </div>
                  <span className={`text-[11px] hidden sm:block ${active ? "text-stone-800 font-medium" : "text-stone-400"}`}>{label}</span>
                </div>
                {n < WIZARD_STEPS.length && <div className="h-px flex-1 mx-2" style={{ backgroundColor: done ? "var(--accent)" : "#EFEDE8" }} />}
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8">
          {step === 1 && (
            <div>
              <h2 className="font-display text-lg font-semibold text-stone-900 mb-1">What's your business called?</h2>
              <p className="text-sm text-stone-500 mb-4">This appears on your calendar and booking page.</p>
              <input
                className="field-input mb-6 text-base"
                placeholder="e.g. Maple & Co."
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                autoFocus
              />
              <h2 className="font-display text-lg font-semibold text-stone-900 mb-1">What kind of business is it?</h2>
              <p className="text-sm text-stone-500 mb-4">We'll pre-fill services, hours, and team roles you can edit anytime.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.values(PRESETS).map((p) => {
                  const Icon = p.icon;
                  const selected = presetId === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => choosePreset(p.id)}
                      className="text-left rounded-2xl p-3.5 border transition-all"
                      style={selected ? { borderColor: p.accent, backgroundColor: withAlpha(p.accent, "14") } : { borderColor: "#E7E5E0" }}
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: withAlpha(p.accent, "1F") }}>
                        <Icon size={17} style={{ color: p.accent }} />
                      </div>
                      <div className="text-sm font-semibold text-stone-900">{p.label}</div>
                      <div className="text-[11px] text-stone-500 mt-0.5 leading-snug">{p.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && draft && (
            <div>
              <h2 className="font-display text-lg font-semibold text-stone-900 mb-1">How can customers reach you?</h2>
              <p className="text-sm text-stone-500 mb-4">All optional — fill in what's relevant.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="field-label">Email</label>
                  <input className="field-input" value={draft.business.email} onChange={(e) => setDraft({ ...draft, business: { ...draft.business, email: e.target.value } })} placeholder="hello@business.com" />
                </div>
                <div>
                  <label className="field-label">Phone</label>
                  <input className="field-input" value={draft.business.phone} onChange={(e) => setDraft({ ...draft, business: { ...draft.business, phone: e.target.value } })} placeholder="(555) 123-4567" />
                </div>
                <div className="sm:col-span-2">
                  <label className="field-label">Address</label>
                  <input className="field-input" value={draft.business.address} onChange={(e) => setDraft({ ...draft, business: { ...draft.business, address: e.target.value } })} placeholder="123 Main Street, Springfield" />
                </div>
                <div>
                  <label className="field-label">Website</label>
                  <input className="field-input" value={draft.business.website} onChange={(e) => setDraft({ ...draft, business: { ...draft.business, website: e.target.value } })} placeholder="www.business.com" />
                </div>
                <div>
                  <label className="field-label">Currency</label>
                  <select className="field-input" value={draft.business.currency} onChange={(e) => setDraft({ ...draft, business: { ...draft.business, currency: e.target.value } })}>
                    {Object.keys(CURRENCY_SYMBOLS).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && draft && (
            <div>
              <h2 className="font-display text-lg font-semibold text-stone-900 mb-1">When are you open?</h2>
              <p className="text-sm text-stone-500 mb-4">We've started you off with typical hours for {PRESETS[presetId].label.toLowerCase()}.</p>
              <HoursEditor hours={draft.hours} onChange={(hours) => setDraft({ ...draft, hours })} />
            </div>
          )}

          {step === 4 && draft && (
            <div>
              <h2 className="font-display text-lg font-semibold text-stone-900 mb-1">Services & team</h2>
              <p className="text-sm text-stone-500 mb-4">Edit, remove, or add to this starting list.</p>
              <div className="mb-6">
                <div className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Services</div>
                <ServicesEditor services={draft.services} onChange={(services) => setDraft({ ...draft, services })} currencySymbol={CURRENCY_SYMBOLS[draft.business.currency] || "$"} />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-2">Team</div>
                <StaffEditor staff={draft.staff} services={draft.services} onChange={(staff) => setDraft({ ...draft, staff })} />
              </div>
            </div>
          )}

          {step === 5 && draft && (
            <div>
              <h2 className="font-display text-lg font-semibold text-stone-900 mb-1">Pick an accent color</h2>
              <p className="text-sm text-stone-500 mb-4">Used across your calendar and booking page.</p>
              <div className="flex flex-wrap gap-3 mb-6">
                {ACCENT_SWATCHES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setDraft({ ...draft, business: { ...draft.business, accentColor: c.value } })}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: c.value }}
                    aria-label={c.name}
                  >
                    {draft.business.accentColor === c.value && <Check size={16} className="text-white" />}
                  </button>
                ))}
                <input
                  type="color"
                  value={draft.business.accentColor}
                  onChange={(e) => setDraft({ ...draft, business: { ...draft.business, accentColor: e.target.value } })}
                  className="w-9 h-9 rounded-full overflow-hidden border border-stone-200 cursor-pointer"
                  title="Custom color"
                />
              </div>

              <div className="rounded-2xl p-5" style={{ backgroundColor: "#FAF8F4", border: "1px solid #E7E5E0" }}>
                <div className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Summary</div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: withAlpha(draft.business.accentColor, "22") }}>
                    {(() => { const Icon = PRESETS[presetId].icon; return <Icon size={18} style={{ color: draft.business.accentColor }} />; })()}
                  </div>
                  <div>
                    <div className="font-display font-semibold text-stone-900">{draft.business.name}</div>
                    <div className="text-xs text-stone-500">{PRESETS[presetId].label}</div>
                  </div>
                </div>
                <div className="text-sm text-stone-600 grid grid-cols-2 gap-y-1">
                  <span>{draft.services.length} services</span>
                  <span>{draft.staff.length} team members</span>
                  <span>{draft.business.email || "No email set"}</span>
                  <span>{draft.business.phone || "No phone set"}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 ${step === 1 ? "invisible" : "text-stone-600 hover:bg-stone-100"}`}
          >
            <ArrowLeft size={15} /> Back
          </button>
          {step < 5 ? (
            <button
              onClick={() => (step === 1 ? goToStep2() : setStep((s) => s + 1))}
              disabled={step === 1 && (!presetId || !businessName.trim())}
              className="btn-accent px-5 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue <ArrowRight size={15} />
            </button>
          ) : (
            <button onClick={finish} className="btn-accent px-5 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5">
              <Check size={15} /> Finish setup
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== NAVIGATION ============================== */

function Sidebar() {
  const { config, view, setView } = useApp();
  const Icon = PRESETS[config.business.type] ? PRESETS[config.business.type].icon : LayoutGrid;
  const items = [
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "newBooking", label: "New Booking", icon: Plus },
    { id: "settings", label: "Settings", icon: SettingsIcon }
  ];
  return (
    <div className="hidden sm:flex flex-col w-60 shrink-0 border-r border-stone-200 h-screen sticky top-0 p-5" style={{ backgroundColor: "#FAF8F4" }}>
      <div className="flex items-center gap-2.5 mb-8 px-1">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-soft)" }}>
          <Icon size={17} style={{ color: "var(--accent)" }} />
        </div>
        <div className="min-w-0">
          <div className="font-display font-semibold text-stone-900 leading-tight truncate">{config.business.name}</div>
          <div className="text-[11px] text-stone-400">{PRESETS[config.business.type] ? PRESETS[config.business.type].label : "Custom"}</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((it) => {
          const ItemIcon = it.icon;
          const active = view === it.id;
          return (
            <button
              key={it.id}
              onClick={() => setView(it.id)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={active ? { backgroundColor: "var(--accent)", color: "white" } : { color: "#57534E" }}
            >
              <ItemIcon size={17} />
              {it.label}
            </button>
          );
        })}
      </nav>
      <div className="mt-auto px-1 text-[11px] text-stone-400 leading-relaxed">
        Everything here saves automatically.
      </div>
    </div>
  );
}

function MobileNav() {
  const { view, setView } = useApp();
  const items = [
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "newBooking", label: "New", icon: Plus },
    { id: "settings", label: "Settings", icon: SettingsIcon }
  ];
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 flex z-40">
      {items.map((it) => {
        const ItemIcon = it.icon;
        const active = view === it.id;
        return (
          <button key={it.id} onClick={() => setView(it.id)} className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium" style={{ color: active ? "var(--accent)" : "#A8A29E" }}>
            <ItemIcon size={18} />
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/* ============================== CALENDAR ============================== */

function CalendarMonthView({ monthCursor, setMonthCursor }) {
  const { config, bookings, selectedDate, setSelectedDate, setCalendarView } = useApp();
  const cells = getMonthGrid(monthCursor.getFullYear(), monthCursor.getMonth());
  const today = new Date();

  const bookingsByDate = {};
  bookings.forEach((b) => {
    if (b.status === "cancelled") return;
    (bookingsByDate[b.date] = bookingsByDate[b.date] || []).push(b);
  });

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-stone-100">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-stone-400 py-2.5 uppercase tracking-wide">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const iso = toISO(d);
          const inMonth = d.getMonth() === monthCursor.getMonth();
          const isToday = isSameDay(d, today);
          const dayBookings = (bookingsByDate[iso] || []).sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
          const dayKey = WEEKDAY_BY_INDEX[d.getDay()];
          const closed = config.hours[dayKey] && config.hours[dayKey].closed;
          return (
            <button
              key={i}
              onClick={() => { setSelectedDate(iso); setCalendarView("day"); }}
              className="aspect-square sm:aspect-auto sm:h-24 border-b border-r border-stone-100 p-1.5 sm:p-2 flex flex-col items-start text-left hover:bg-stone-50 transition-colors"
              style={{ opacity: inMonth ? 1 : 0.35 }}
            >
              <span
                className="text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full"
                style={isToday ? { backgroundColor: "var(--accent)", color: "white" } : { color: closed ? "#D6D3CE" : "#44403C" }}
              >
                {d.getDate()}
              </span>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {dayBookings.slice(0, 3).map((b) => {
                  const sv = config.services.find((s) => s.id === b.serviceId);
                  return <span key={b.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sv ? sv.color : "#A8A29E" }} />;
                })}
                {dayBookings.length > 3 && <span className="text-[9px] text-stone-400">+{dayBookings.length - 3}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CalendarDayView() {
  const { config, bookings, selectedDate, setSelectedDate, navigateToNewBooking } = useApp();
  const [viewingId, setViewingId] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);
  const dateObj = parseISO(selectedDate);
  const dayKey = WEEKDAY_BY_INDEX[dateObj.getDay()];
  const dayHours = config.hours[dayKey];

  const dayBookings = bookings
    .filter((b) => b.date === selectedDate && (showCancelled || b.status !== "cancelled"))
    .sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedDate(toISO(addDays(dateObj, -1)))} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500">
            <ChevronLeft size={18} />
          </button>
          <div className="min-w-[200px]">
            <div className="font-display font-semibold text-stone-900">{formatDateLong(selectedDate)}</div>
            {dayHours && dayHours.closed && <div className="text-xs text-red-500 font-medium mt-0.5">Closed this day</div>}
          </div>
          <button onClick={() => setSelectedDate(toISO(addDays(dateObj, 1)))} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500">
            <ChevronRight size={18} />
          </button>
          <button onClick={() => setSelectedDate(toISO(new Date()))} className="text-xs font-medium text-stone-500 hover:text-stone-800 px-2 py-1 rounded-lg border border-stone-200 ml-1">
            Today
          </button>
        </div>
        <button onClick={() => navigateToNewBooking(selectedDate)} className="btn-accent px-3.5 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5">
          <Plus size={16} /> New Booking
        </button>
      </div>

      {dayBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200">
          <EmptyState icon={Calendar} title="Nothing booked yet" message="This day is wide open. Create the first booking." actionLabel="New Booking" onAction={() => navigateToNewBooking(selectedDate)} />
        </div>
      ) : (
        <div className="space-y-2">
          {dayBookings.map((b) => <BookingTicket key={b.id} booking={b} onClick={() => setViewingId(b.id)} />)}
        </div>
      )}

      {bookings.some((b) => b.date === selectedDate && b.status === "cancelled") && (
        <button onClick={() => setShowCancelled((v) => !v)} className="text-xs text-stone-400 hover:text-stone-600 mt-3 underline decoration-dotted">
          {showCancelled ? "Hide" : "Show"} cancelled bookings
        </button>
      )}

      {viewingId && <BookingDetailModal bookingId={viewingId} onClose={() => setViewingId(null)} />}
    </div>
  );
}

function CalendarPage() {
  const { config, bookings, calendarView, setCalendarView, terminology, navigateToNewBooking, selectedDate, setSelectedDate } = useApp();
  const [monthCursor, setMonthCursor] = useState(parseISO(selectedDate));

  const todayISO = toISO(new Date());
  const todayCount = bookings.filter((b) => b.date === todayISO && b.status !== "cancelled").length;
  const weekStart = addDays(new Date(), -new Date().getDay());
  const weekEnd = addDays(weekStart, 7);
  const weekCount = bookings.filter((b) => {
    if (b.status === "cancelled") return false;
    const d = parseISO(b.date);
    return d >= weekStart && d < weekEnd;
  }).length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-stone-900">Calendar</h1>
          <p className="text-sm text-stone-500">All your {terminology.nounPlural.toLowerCase()} in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-stone-100 rounded-lg p-1 flex">
            <button
              onClick={() => setCalendarView("month")}
              className="px-3 py-1.5 rounded-md text-sm font-medium"
              style={calendarView === "month" ? { backgroundColor: "white", color: "#1c1917", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" } : { color: "#78716C" }}
            >
              Month
            </button>
            <button
              onClick={() => setCalendarView("day")}
              className="px-3 py-1.5 rounded-md text-sm font-medium"
              style={calendarView === "day" ? { backgroundColor: "white", color: "#1c1917", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" } : { color: "#78716C" }}
            >
              Day
            </button>
          </div>
          <button onClick={() => navigateToNewBooking(selectedDate)} className="btn-accent px-3.5 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5">
            <Plus size={16} /> New Booking
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard label="Today" value={todayCount} icon={Calendar} />
        <StatCard label="This week" value={weekCount} icon={ClipboardList} />
        <StatCard label="Awaiting confirmation" value={pendingCount} icon={AlertCircle} />
      </div>

      {calendarView === "month" ? (
        <>
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setMonthCursor((m) => addMonths(m, -1))} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500">
              <ChevronLeft size={18} />
            </button>
            <div className="font-display font-semibold text-stone-900 w-40 text-center">{formatMonthYear(monthCursor)}</div>
            <button onClick={() => setMonthCursor((m) => addMonths(m, 1))} className="p-2 rounded-lg hover:bg-stone-100 text-stone-500">
              <ChevronRight size={18} />
            </button>
            <button onClick={() => setMonthCursor(new Date())} className="text-xs font-medium text-stone-500 hover:text-stone-800 px-2 py-1 rounded-lg border border-stone-200 ml-1">
              Today
            </button>
          </div>
          <CalendarMonthView monthCursor={monthCursor} setMonthCursor={setMonthCursor} />
        </>
      ) : (
        <CalendarDayView />
      )}
    </div>
  );
}

/* ============================== NEW BOOKING PAGE ============================== */

function NewBookingPage() {
  const { config, bookings, addBooking, updateBooking, toast, terminology, currencySymbol, editingBookingId, setEditingBookingId, selectedDate, setSelectedDate, setView, setCalendarView } = useApp();

  const editingBooking = editingBookingId ? bookings.find((b) => b.id === editingBookingId) : null;

  const [date, setDate] = useState(editingBooking ? editingBooking.date : selectedDate);
  const [serviceId, setServiceId] = useState(editingBooking ? editingBooking.serviceId : "");
  const [staffChoice, setStaffChoice] = useState(editingBooking ? (editingBooking.staffId || "any") : "any");
  const [time, setTime] = useState(editingBooking ? editingBooking.startTime : "");
  const [customerName, setCustomerName] = useState(editingBooking ? editingBooking.customerName : "");
  const [customerPhone, setCustomerPhone] = useState(editingBooking ? editingBooking.customerPhone : "");
  const [customerEmail, setCustomerEmail] = useState(editingBooking ? editingBooking.customerEmail : "");
  const [guestCount, setGuestCount] = useState(editingBooking && editingBooking.guestCount ? editingBooking.guestCount : 2);
  const [notes, setNotes] = useState(editingBooking ? editingBooking.notes : "");

  const service = config.services.find((s) => s.id === serviceId);
  const activeServices = config.services.filter((s) => s.active !== false);

  const eligibleStaff = service && service.staffRequired ? config.staff.filter((s) => s.active !== false && s.services.includes(service.id)) : [];

  const today = toISO(new Date());
  const maxDate = toISO(addDays(new Date(), config.bookingRules.maxAdvanceDays || 60));

  const slots = service
    ? getAvailableSlots(config, bookings, date, service, staffChoice !== "any" ? staffChoice : null, editingBookingId)
    : [];

  useEffect(() => {
    if (time && !slots.includes(time)) setTime("");
    // eslint-disable-next-line
  }, [serviceId, date, staffChoice]);

  const canSubmit = service && date && time && customerName.trim();

  const submit = () => {
    if (!canSubmit) return;
    let finalStaffId = null;
    if (service.staffRequired) {
      finalStaffId = staffChoice !== "any" ? staffChoice : pickStaffForBooking(config, bookings, service, date, time, editingBookingId);
      if (!finalStaffId) {
        toast("That time just got taken — pick another slot", "error");
        return;
      }
    }
    const endTime = toHHMM(toMinutes(time) + service.duration);
    const payload = {
      serviceId: service.id,
      staffId: finalStaffId,
      date, startTime: time, endTime,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      notes: notes.trim(),
      guestCount: service.trackGuests ? guestCount : null
    };

    if (editingBooking) {
      updateBooking(editingBooking.id, payload);
      toast("Booking updated");
    } else {
      addBooking({
        id: uid(),
        ...payload,
        status: config.bookingRules.requireApproval ? "pending" : "confirmed",
        createdAt: new Date().toISOString()
      });
      toast(config.bookingRules.requireApproval ? "Booking added — awaiting confirmation" : "Booking confirmed");
    }
    setEditingBookingId(null);
    setSelectedDate(date);
    setCalendarView("day");
    setView("calendar");
  };

  const cancelEdit = () => {
    setEditingBookingId(null);
    setView("calendar");
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl font-semibold text-stone-900">{editingBooking ? `Edit ${terminology.noun}` : `New ${terminology.noun}`}</h1>
        {editingBooking && (
          <button onClick={cancelEdit} className="text-sm text-stone-400 hover:text-stone-700">Cancel edit</button>
        )}
      </div>
      <p className="text-sm text-stone-500 mb-6">A few quick steps to get this on the calendar.</p>

      {/* When */}
      <section className="mb-6">
        <div className="section-eyebrow">1 · When</div>
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" min={today} max={maxDate} className="field-input w-44" value={date} onChange={(e) => setDate(e.target.value)} />
          {[0, 1, 2].map((n) => {
            const d = toISO(addDays(new Date(), n));
            const label = n === 0 ? "Today" : n === 1 ? "Tomorrow" : formatDateLong(d).split(",")[0];
            return (
              <button
                key={n}
                onClick={() => setDate(d)}
                className="px-3 py-2 rounded-lg text-xs font-medium border"
                style={date === d ? { backgroundColor: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--accent)" } : { borderColor: "#E7E5E0", color: "#78716C" }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </section>

      {/* What */}
      <section className="mb-6">
        <div className="section-eyebrow">2 · What</div>
        {activeServices.length === 0 ? (
          <div className="text-sm text-stone-500 bg-stone-50 rounded-xl p-4">No bookable services yet. Add one in Settings → Services.</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2.5">
            {activeServices.map((s) => {
              const selected = serviceId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setServiceId(s.id)}
                  className="text-left rounded-xl p-3.5 border flex items-start gap-3"
                  style={selected ? { borderColor: s.color, backgroundColor: withAlpha(s.color, "12") } : { borderColor: "#E7E5E0" }}
                >
                  <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: s.color }} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-stone-900">{s.name}</div>
                    <div className="text-xs text-stone-500 mt-0.5">
                      {s.duration} min{s.price ? ` · ${currencySymbol}${s.price}` : ""}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Who */}
      {service && service.staffRequired && (
        <section className="mb-6">
          <div className="section-eyebrow">3 · Who</div>
          {eligibleStaff.length === 0 ? (
            <div className="text-sm text-amber-700 bg-amber-50 rounded-xl p-4">No team member currently offers this service. Add one in Settings → Team.</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStaffChoice("any")}
                className="px-3.5 py-2 rounded-lg text-sm font-medium border"
                style={staffChoice === "any" ? { backgroundColor: "var(--accent-soft)", borderColor: "var(--accent)", color: "var(--accent)" } : { borderColor: "#E7E5E0", color: "#57534E" }}
              >
                Any available
              </button>
              {eligibleStaff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStaffChoice(s.id)}
                  className="px-3.5 py-2 rounded-lg text-sm font-medium border"
                  style={staffChoice === s.id ? { backgroundColor: withAlpha(s.color, "1A"), borderColor: s.color, color: s.color } : { borderColor: "#E7E5E0", color: "#57534E" }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Time */}
      {service && (
        <section className="mb-6">
          <div className="section-eyebrow">{service.staffRequired ? "4" : "3"} · Time</div>
          {slots.length === 0 ? (
            <div className="text-sm text-stone-500 bg-stone-50 rounded-xl p-4">No times available that day — try another date{service.staffRequired ? " or team member" : ""}.</div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
              {slots.map((t) => (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium border"
                  style={time === t ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)", color: "white" } : { borderColor: "#E7E5E0", color: "#57534E" }}
                >
                  {formatTime12(t)}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Details */}
      {service && time && (
        <section className="mb-8">
          <div className="section-eyebrow">{service.staffRequired ? "5" : "4"} · Details</div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="field-label">Customer name *</label>
              <input className="field-input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Full name" />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input className="field-input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="field-label">Email</label>
              <input className="field-input" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="name@email.com" />
            </div>
            {service.trackGuests && (
              <div>
                <label className="field-label">Number of guests</label>
                <input type="number" min={1} className="field-input" value={guestCount} onChange={(e) => setGuestCount(clampNum(Number(e.target.value) || 1, 1, 999))} />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="field-label">Notes</label>
              <textarea className="field-input resize-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, preferences, anything the team should know" />
            </div>
          </div>
        </section>
      )}

      {/* Sticky confirm bar */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-stone-200 -mx-4 sm:mx-0 px-4 sm:px-0 py-4 sm:rounded-2xl sm:border sm:p-4 flex items-center justify-between gap-3 mb-16 sm:mb-0">
        <div className="text-sm text-stone-500 min-w-0 truncate">
          {service && time ? (
            <>
              <span className="font-medium text-stone-800">{service.name}</span> · {formatDateLong(date).split(",").slice(0, 2).join(",")} · {formatTime12(time)}
            </>
          ) : (
            "Fill in the steps above"
          )}
        </div>
        <button onClick={submit} disabled={!canSubmit} className="btn-accent px-5 py-2.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
          <Check size={16} /> {editingBooking ? "Save changes" : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}

/* ============================== SETTINGS ============================== */

function SettingsGeneral() {
  const { config, setConfig, setView, setConfirmDialog } = useApp();
  const b = config.business;
  const update = (patch) => setConfig({ ...config, business: { ...b, ...patch } });
  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <label className="field-label">Business name</label>
        <input className="field-input" value={b.name} onChange={(e) => update({ name: e.target.value })} />
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Email</label>
          <input className="field-input" value={b.email} onChange={(e) => update({ email: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Phone</label>
          <input className="field-input" value={b.phone} onChange={(e) => update({ phone: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Address</label>
          <input className="field-input" value={b.address} onChange={(e) => update({ address: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Website</label>
          <input className="field-input" value={b.website} onChange={(e) => update({ website: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Currency</label>
          <select className="field-input" value={b.currency} onChange={(e) => update({ currency: e.target.value })}>
            {Object.keys(CURRENCY_SYMBOLS).map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="pt-4 border-t border-stone-100">
        <div className="text-sm font-medium text-stone-800 mb-1">Business type</div>
        <p className="text-xs text-stone-500 mb-3">Currently set to <strong>{PRESETS[b.type] ? PRESETS[b.type].label : "Custom"}</strong>. Re-running setup lets you pick a new type and starting template — your current services, team, and hours will be replaced.</p>
        <button
          onClick={() =>
            setConfirmDialog({
              title: "Re-run setup?",
              message: "This replaces your current services, team, and hours with a new template. Existing bookings are kept.",
              confirmLabel: "Re-run setup",
              destructive: true,
              onConfirm: () => setView("setup")
            })
          }
          className="px-3.5 py-2 rounded-lg text-sm font-semibold border border-stone-200 text-stone-700 hover:bg-stone-50 inline-flex items-center gap-2"
        >
          <RotateCcw size={15} /> Re-run setup wizard
        </button>
      </div>
    </div>
  );
}

function SettingsHours() {
  const { config, setConfig } = useApp();
  return (
    <div className="max-w-xl">
      <HoursEditor hours={config.hours} onChange={(hours) => setConfig({ ...config, hours })} />
    </div>
  );
}

function SettingsServices() {
  const { config, setConfig, currencySymbol } = useApp();
  return <ServicesEditor services={config.services} onChange={(services) => setConfig({ ...config, services })} currencySymbol={currencySymbol} />;
}

function SettingsStaff() {
  const { config, setConfig } = useApp();
  return <StaffEditor staff={config.staff} services={config.services} onChange={(staff) => setConfig({ ...config, staff })} />;
}

function SettingsRules() {
  const { config, setConfig } = useApp();
  const r = config.bookingRules;
  const update = (patch) => setConfig({ ...config, bookingRules: { ...r, ...patch } });
  return (
    <div className="max-w-xl space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label">Slot interval (minutes)</label>
          <select className="field-input" value={r.slotInterval} onChange={(e) => update({ slotInterval: Number(e.target.value) })}>
            {[5, 10, 15, 20, 30, 60].map((v) => <option key={v} value={v}>{v} min</option>)}
          </select>
          <p className="field-hint">How granular available time slots are.</p>
        </div>
        <div>
          <label className="field-label">Buffer between bookings (minutes)</label>
          <input type="number" min={0} className="field-input" value={r.bufferTime} onChange={(e) => update({ bufferTime: Math.max(0, Number(e.target.value) || 0) })} />
          <p className="field-hint">Gap kept clear before and after each booking.</p>
        </div>
        <div>
          <label className="field-label">Minimum notice (hours)</label>
          <input type="number" min={0} className="field-input" value={r.minAdvanceHours} onChange={(e) => update({ minAdvanceHours: Math.max(0, Number(e.target.value) || 0) })} />
          <p className="field-hint">How soon before a slot it can still be booked.</p>
        </div>
        <div>
          <label className="field-label">Booking window (days ahead)</label>
          <input type="number" min={1} className="field-input" value={r.maxAdvanceDays} onChange={(e) => update({ maxAdvanceDays: Math.max(1, Number(e.target.value) || 1) })} />
          <p className="field-hint">How far in the future bookings can be made.</p>
        </div>
        <div>
          <label className="field-label">Cancellation notice (hours)</label>
          <input type="number" min={0} className="field-input" value={r.cancellationWindowHours} onChange={(e) => update({ cancellationWindowHours: Math.max(0, Number(e.target.value) || 0) })} />
          <p className="field-hint">Shown to customers as your cancellation policy.</p>
        </div>
      </div>
      <div className="flex items-center gap-3 pt-2 border-t border-stone-100">
        <Toggle checked={r.requireApproval} onChange={(v) => update({ requireApproval: v })} label="Require manual approval" />
        <div>
          <div className="text-sm font-medium text-stone-800">Require manual approval</div>
          <p className="text-xs text-stone-500">New bookings start as "Pending" until you confirm them.</p>
        </div>
      </div>
    </div>
  );
}

function SettingsAppearance() {
  const { config, setConfig } = useApp();
  const b = config.business;
  return (
    <div className="max-w-xl space-y-5">
      <div>
        <label className="field-label">Accent color</label>
        <div className="flex flex-wrap gap-3 mt-1">
          {ACCENT_SWATCHES.map((c) => (
            <button
              key={c.value}
              onClick={() => setConfig({ ...config, business: { ...b, accentColor: c.value } })}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ backgroundColor: c.value }}
              aria-label={c.name}
            >
              {b.accentColor === c.value && <Check size={16} className="text-white" />}
            </button>
          ))}
          <input
            type="color"
            value={b.accentColor}
            onChange={(e) => setConfig({ ...config, business: { ...b, accentColor: e.target.value } })}
            className="w-9 h-9 rounded-full overflow-hidden border border-stone-200 cursor-pointer"
            title="Custom color"
          />
        </div>
      </div>
      <div className="rounded-2xl p-5 border border-stone-200">
        <div className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-3">Preview</div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--accent-soft)" }}>
            <CalendarDays size={18} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <div className="font-display font-semibold text-stone-900">{b.name}</div>
            <button className="btn-accent text-xs px-2.5 py-1 rounded-md mt-1">New Booking</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsData() {
  const { config, bookings, setConfig, setBookings, toast, setConfirmDialog, setView } = useApp();

  const exportData = () => {
    const data = JSON.stringify({ config, bookings }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(config.business.name || "booking-data").toLowerCase().replace(/\s+/g, "-")}-export.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Export downloaded");
  };

  const importData = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed.config) setConfig(parsed.config);
        if (parsed.bookings) setBookings(parsed.bookings);
        toast("Data imported");
      } catch (err) {
        toast("Couldn't read that file — make sure it's a valid export", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <div className="text-sm font-medium text-stone-800 mb-1">Export your data</div>
        <p className="text-xs text-stone-500 mb-3">Download everything — settings and bookings — as a JSON file.</p>
        <button onClick={exportData} className="px-3.5 py-2 rounded-lg text-sm font-semibold border border-stone-200 text-stone-700 hover:bg-stone-50 inline-flex items-center gap-2">
          <Download size={15} /> Export data
        </button>
      </div>
      <div className="pt-4 border-t border-stone-100">
        <div className="text-sm font-medium text-stone-800 mb-1">Import data</div>
        <p className="text-xs text-stone-500 mb-3">Replaces your current settings and bookings with the contents of the file.</p>
        <label className="px-3.5 py-2 rounded-lg text-sm font-semibold border border-stone-200 text-stone-700 hover:bg-stone-50 inline-flex items-center gap-2 cursor-pointer w-fit">
          <Upload size={15} /> Choose file
          <input type="file" accept="application/json" className="hidden" onChange={importData} />
        </label>
      </div>
      <div className="pt-4 border-t border-stone-100">
        <div className="text-sm font-medium text-red-600 mb-1">Reset everything</div>
        <p className="text-xs text-stone-500 mb-3">Erases all settings and bookings and restarts setup. This can't be undone.</p>
        <button
          onClick={() =>
            setConfirmDialog({
              title: "Reset all data?",
              message: "This permanently deletes your settings and every booking. You'll be taken back to setup.",
              confirmLabel: "Reset everything",
              destructive: true,
              onConfirm: async () => {
                if (window.storage) {
                  try { await window.storage.delete("config"); } catch (e) {}
                  try { await window.storage.delete("bookings"); } catch (e) {}
                }
                setConfig(null);
                setBookings([]);
                setView("setup");
                toast("All data cleared");
              }
            })
          }
          className="px-3.5 py-2 rounded-lg text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-2"
        >
          <Trash2 size={15} /> Reset all data
        </button>
      </div>
    </div>
  );
}

const SETTINGS_TABS = [
  { id: "general", label: "General", icon: Building2 },
  { id: "hours", label: "Hours", icon: Clock },
  { id: "services", label: "Services", icon: ListChecks },
  { id: "staff", label: "Team", icon: Users },
  { id: "rules", label: "Booking Rules", icon: SettingsIcon },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "data", label: "Data", icon: Database }
];

function SettingsPage() {
  const [tab, setTab] = useState("general");
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-stone-900 mb-1">Settings</h1>
      <p className="text-sm text-stone-500 mb-5">Almost everything here is yours to customize.</p>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
        {SETTINGS_TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="shrink-0 px-3.5 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 border"
              style={active ? { backgroundColor: "var(--accent)", borderColor: "var(--accent)", color: "white" } : { borderColor: "#E7E5E0", color: "#57534E" }}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === "general" && <SettingsGeneral />}
      {tab === "hours" && <SettingsHours />}
      {tab === "services" && <SettingsServices />}
      {tab === "staff" && <SettingsStaff />}
      {tab === "rules" && <SettingsRules />}
      {tab === "appearance" && <SettingsAppearance />}
      {tab === "data" && <SettingsData />}
    </div>
  );
}

/* ============================== ROOT APP ============================== */

export default function App() {
  const [config, setConfig] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState("calendar");
  const [calendarView, setCalendarView] = useState("month");
  const [selectedDate, setSelectedDate] = useState(toISO(new Date()));
  const [editingBookingId, setEditingBookingId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const saveTimer = useRef(null);

  // Load persisted data
  useEffect(() => {
    (async () => {
      if (window.storage) {
        try {
          const cfgRes = await window.storage.get("config");
          if (cfgRes && cfgRes.value) setConfig(JSON.parse(cfgRes.value));
        } catch (e) {}
        try {
          const bkRes = await window.storage.get("bookings");
          if (bkRes && bkRes.value) setBookings(JSON.parse(bkRes.value));
        } catch (e) {}
      }
      setLoaded(true);
    })();
  }, []);

  // Debounced persistence
  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!window.storage) return;
      try {
        if (config) await window.storage.set("config", JSON.stringify(config));
      } catch (e) {}
      try {
        await window.storage.set("bookings", JSON.stringify(bookings));
      } catch (e) {}
    }, 500);
    return () => clearTimeout(saveTimer.current);
  }, [config, bookings, loaded]);

  useEffect(() => {
    if (config && config.setupComplete && view === "setup") setView("calendar");
  }, [config]);

  const toast = (message, type = "success") => {
    const id = uid();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  };

  const addBooking = (data) => setBookings((prev) => [...prev, data]);
  const updateBooking = (id, patch) => setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const removeBooking = (id) => setBookings((prev) => prev.filter((b) => b.id !== id));

  const navigateToNewBooking = (date) => {
    setEditingBookingId(null);
    setSelectedDate(date || toISO(new Date()));
    setView("newBooking");
  };
  const navigateToEdit = (bookingId) => {
    setEditingBookingId(bookingId);
    setView("newBooking");
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FAF8F4" }}>
        <div className="text-stone-400 text-sm">Loading…</div>
      </div>
    );
  }

  if (!config || !config.setupComplete) {
    const accentColor = config ? config.business.accentColor : "#52525B";
    return (
      <AppCtx.Provider value={{ setConfig, toast, existingConfig: config }}>
        <div className="app-root font-body" style={{ "--accent": accentColor, "--accent-soft": withAlpha(accentColor, "1F") }}>
          <GlobalStyle />
          <SetupWizard />
          <ToastStack toasts={toasts} />
        </div>
      </AppCtx.Provider>
    );
  }

  const accentColor = config.business.accentColor;
  const currencySymbol = CURRENCY_SYMBOLS[config.business.currency] || "$";
  const terminology = config.terminology || { noun: "Booking", nounPlural: "Bookings" };

  const ctxValue = {
    config, setConfig, bookings, setBookings,
    addBooking, updateBooking, removeBooking,
    view, setView, calendarView, setCalendarView,
    selectedDate, setSelectedDate,
    editingBookingId, setEditingBookingId,
    navigateToNewBooking, navigateToEdit,
    toast, currencySymbol, terminology,
    confirmDialog, setConfirmDialog
  };

  return (
    <AppCtx.Provider value={ctxValue}>
      <div className="app-root font-body min-h-screen flex" style={{ "--accent": accentColor, "--accent-soft": withAlpha(accentColor, "1F"), backgroundColor: "#FAF8F4" }}>
        <GlobalStyle />
        <Sidebar />
        <main className="flex-1 min-w-0 p-4 sm:p-8 pb-24 sm:pb-8">
          {view === "calendar" && <CalendarPage />}
          {view === "newBooking" && <NewBookingPage />}
          {view === "settings" && <SettingsPage />}
        </main>
        <MobileNav />
        <ToastStack toasts={toasts} />
        <ConfirmDialog
          open={!!confirmDialog}
          title={confirmDialog ? confirmDialog.title : ""}
          message={confirmDialog ? confirmDialog.message : ""}
          confirmLabel={confirmDialog ? confirmDialog.confirmLabel : "Confirm"}
          destructive={confirmDialog ? confirmDialog.destructive : false}
          onCancel={() => setConfirmDialog(null)}
          onConfirm={() => {
            const fn = confirmDialog && confirmDialog.onConfirm;
            setConfirmDialog(null);
            if (fn) fn();
          }}
        />
      </div>
    </AppCtx.Provider>
  );
}

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
      .font-display { font-family: 'Fraunces', serif; }
      .font-body, .app-root { font-family: 'Inter', system-ui, sans-serif; }
      .btn-accent {
        background-color: var(--accent);
        color: white;
      }
      .btn-accent:hover { filter: brightness(0.93); }
      .field-label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: #78716C;
        margin-bottom: 4px;
      }
      .field-hint {
        font-size: 11px;
        color: #A8A29E;
        margin-top: 4px;
      }
      .field-input {
        width: 100%;
        border: 1px solid #E7E5E0;
        border-radius: 10px;
        padding: 8px 12px;
        font-size: 14px;
        color: #1c1917;
        background: white;
        outline: none;
        transition: border-color 0.15s;
      }
      .field-input:focus { border-color: var(--accent); }
      .section-eyebrow {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #A8A29E;
        margin-bottom: 10px;
      }
      .ticket { border-left-width: 4px; border-left-style: solid; }
      @keyframes toastIn { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }
      .toast-pop { animation: toastIn 0.2s ease-out; }
      input[type="time"]::-webkit-calendar-picker-indicator,
      input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-thumb { background: #E7E5E0; border-radius: 8px; }
    `}</style>
  );
}

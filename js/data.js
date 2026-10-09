// Frontend-only sample data.
// TODO: Replace these collections with API/database requests when the backend is implemented.

window.LONGOS_DATA = {
  currentUser: null,

  patients: [
    { id: "P-1001", name: "Maria Santos", nickname: "Mia", sex: "Female", age: 42, birthdate: "1984-03-18", phone: "0917-555-0101", address: "Longos, Malabon City", familyNo: "FAM-0241", status: "Active", bp: "128/82", oxygen: "98%", lastVisit: "2026-09-29" },
    { id: "P-1002", name: "Juan Dela Cruz", nickname: "Juan", sex: "Male", age: 35, birthdate: "1991-07-02", phone: "0918-555-0102", address: "Longos, Malabon City", familyNo: "FAM-0187", status: "Active", bp: "120/80", oxygen: "99%", lastVisit: "2026-09-30" },
    { id: "P-1003", name: "Lorna Reyes", nickname: "Lorna", sex: "Female", age: 56, birthdate: "1970-01-14", phone: "0919-555-0103", address: "Longos, Malabon City", familyNo: "FAM-0318", status: "Active", bp: "135/88", oxygen: "97%", lastVisit: "2026-09-28" },
    { id: "P-1004", name: "Carlo Mendoza", nickname: "Caloy", sex: "Male", age: 24, birthdate: "2002-04-27", phone: "0920-555-0104", address: "Longos, Malabon City", familyNo: "FAM-0442", status: "Active", bp: "118/76", oxygen: "99%", lastVisit: "2026-09-30" },
    { id: "P-1005", name: "Ana Garcia", nickname: "Ana", sex: "Female", age: 29, birthdate: "1997-11-08", phone: "0921-555-0105", address: "Longos, Malabon City", familyNo: "FAM-0501", status: "Active", bp: "122/80", oxygen: "98%", lastVisit: "2026-09-30" }
  ],

  clinicalRecords: {
    "P-1001": [
      { date: "2026-08-14", provider: "Dr. Angela Ramos", diagnosis: "Upper respiratory tract infection", prescription: "Symptomatic treatment; hydration and rest.", notes: "Follow-up if symptoms persist." },
      { date: "2026-09-29", provider: "Dr. Angela Ramos", diagnosis: "Hypertension screening", prescription: "Lifestyle counseling; monitor BP.", notes: "Repeat BP monitoring advised." }
    ],
    "P-1002": [
      { date: "2026-09-12", provider: "Dr. Angela Ramos", diagnosis: "Acute gastritis", prescription: "Prescribed medication as clinically indicated.", notes: "Return if pain worsens." }
    ],
    "P-1003": [
      { date: "2026-09-28", provider: "Dr. Angela Ramos", diagnosis: "Routine consultation", prescription: "Continue existing care plan.", notes: "Routine follow-up." }
    ],
    "P-1004": [],
    "P-1005": []
  },

  queue: [
    { number: "Q-018", patientId: "P-1001", patientName: "Maria Santos", nickname: "Mia", status: "Serving", purpose: "Consultation" },
    { number: "Q-019", patientId: "P-1002", patientName: "Juan Dela Cruz", nickname: "Juan", status: "Waiting", purpose: "Consultation" },
    { number: "Q-020", patientId: "P-1003", patientName: "Lorna Reyes", nickname: "Lorna", status: "Waiting", purpose: "Consultation" },
    { number: "Q-021", patientId: "P-1004", patientName: "Carlo Mendoza", nickname: "Caloy", status: "Waiting", purpose: "Consultation" },
    { number: "Q-022", patientId: "P-1005", patientName: "Ana Garcia", nickname: "Ana", status: "Waiting", purpose: "Consultation" }
  ],

  users: [
    { id: "U-001", name: "Rina Bautista", role: "Staff / Front Desk", username: "staff01", status: "Active" },
    { id: "U-002", name: "Dr. Angela Ramos", role: "Doctor", username: "doctor01", status: "Active" },
    { id: "U-003", name: "Mark Villanueva", role: "Administrator", username: "admin01", status: "Active" },
    { id: "U-004", name: "Maria Santos", role: "Patient", username: "patient01", status: "Active" }
  ],

  providers: [
    { id: "D-001", name: "Dr. Angela Ramos", role: "Physician", schedule: "Mon–Fri, 8:00 AM–4:00 PM", status: "Available" },
    { id: "D-002", name: "Nurse Carla Flores", role: "Nurse", schedule: "Mon–Sat, 8:00 AM–4:00 PM", status: "Available" },
    { id: "D-003", name: "Midwife Elena Cruz", role: "Midwife", schedule: "Mon–Fri, 8:00 AM–3:00 PM", status: "Scheduled" }
  ],

  services: [
    { id: "S-001", name: "General Consultation", description: "Primary consultation and basic assessment.", schedule: "Monday–Friday • 8:00 AM–4:00 PM" },
    { id: "S-002", name: "Maternal & Child Care", description: "Maternal, newborn, and child health services.", schedule: "Monday–Friday • 8:00 AM–3:00 PM" },
    { id: "S-003", name: "Immunization", description: "Routine vaccination services according to health-center schedule.", schedule: "Tuesday & Thursday • 8:00 AM–12:00 PM" },
    { id: "S-004", name: "Health Screening", description: "Basic health screening and initial assessment.", schedule: "Monday–Saturday • 8:00 AM–4:00 PM" },
    { id: "S-005", name: "Family Planning", description: "Family planning counseling and related services.", schedule: "Wednesday • 8:00 AM–3:00 PM" },
    { id: "S-006", name: "Health Education", description: "Health information and preventive-care guidance.", schedule: "By health-center schedule" }
  ],

  facility: {
    name: "Barangay Longos Super Health Center",
    address: "Longos, Malabon City",
    hours: "Monday–Saturday • 8:00 AM–4:00 PM",
    guide: [
      ["Entrance / Registration", "Front entrance • Proceed to the front desk for registration."],
      ["Waiting Area", "Main waiting area beside the registration/front desk."],
      ["Consultation Room", "Proceed here when your queue number is called."],
      ["Nursing / Assessment Area", "Initial assessment including basic vital information."],
      ["Information Display", "Public monitor showing queue, services, schedules, and facility information."]
    ]
  }
};

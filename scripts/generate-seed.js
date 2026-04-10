const fs = require('fs');
const crypto = require('crypto');

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomDate(start, end) { return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())); }

const firstNames = ['Arjun', 'Priya', 'Rohan', 'Sneha', 'Vikram', 'Aisha', 'Karthik', 'Divya', 'Rahul', 'Ananya', 'Karan', 'Neha', 'Aditya', 'Pooja', 'Siddharth', 'Meera', 'Rishabh', 'Riya', 'Sameer', 'Tanvi'];
const lastNames = ['Mehta', 'Sharma', 'Gupta', 'Patel', 'Singh', 'Khan', 'Reddy', 'Nair', 'Joshi', 'Verma', 'Kumar', 'Kapoor', 'Malhotra', 'Rao', 'Das', 'Sen', 'Sinha', 'Chopra', 'Bansal', 'Agarwal'];
const branches = ['B.Tech CSE', 'B.Tech IT', 'B.Tech ECE', 'BBA', 'B.Com', 'MBA', 'B.Sc Physics', 'LLB'];
const classes = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const batches = ['2021-2025', '2022-2026', '2023-2027', '2024-2028'];
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const medicalConditions = ['Asthma', 'Diabetes Type 1', 'Seasonal allergies', 'Penicillin allergy', 'Lactose intolerance', 'Migraine', 'Hypertension', 'NULL', 'NULL', 'NULL', 'NULL', 'NULL'];

const diagnoses = ['Upper Respiratory Infection', 'Bronchial Asthma', 'Viral Fever', 'Contact Dermatitis', 'Acute Gastritis', 'Common Cold', 'Allergic Rhinitis', 'Tension Headache', 'Gastroenteritis', 'Nutritional Deficiency'];
const specialties = ['General Medicine', 'Respiratory', 'Dermatology', 'Endocrinology', 'Nutrition', 'Orthopaedics', 'ENT'];
const treatments = ['Paracetamol 500mg TID', 'Cetirizine 10mg OD', 'Ibuprofen 400mg', 'ORS and Rest', 'Cough Syrup', 'Antacid', 'Antibiotics course'];
const notesPool = ['Patient advised to rest.', 'Follow up in 3 days if symptoms persist.', 'Mild issue, self-limiting.', 'Prescribed medication.', 'Advised hydration and bland diet.'];

const numStudents = 50;
const numAppointments = 200;
const numRecords = 200;
const numPrescriptions = 150;
const numOrders = 100;
const numClaims = 80;
const numLeaves = 60;
const numSOS = 30;

const newDoctorsList = [
  { id: 'd0000000-0000-0000-0000-000000000002', name: 'Dr. Rajesh Kumar', email: 'doctor2@sau.edu.in', phone: '+91 9800000011', specialty: 'Orthopaedics' },
  { id: 'd0000000-0000-0000-0000-000000000003', name: 'Dr. Neha Verma', email: 'doctor3@sau.edu.in', phone: '+91 9800000012', specialty: 'Dermatology' },
  { id: 'd0000000-0000-0000-0000-000000000004', name: 'Dr. Anil Kapoor', email: 'doctor4@sau.edu.in', phone: '+91 9800000013', specialty: 'Endocrinology' },
  { id: 'd0000000-0000-0000-0000-000000000005', name: 'Dr. Sunita Rao', email: 'doctor5@sau.edu.in', phone: '+91 9800000014', specialty: 'ENT' }
];

const allDoctorsPool = [
  { id: 'v_doctor_id', name: 'Dr. Jane Smith', specialty: 'General Medicine', isVariable: true },
  ...newDoctorsList
];

let sql = `-- =============================================================================
-- UniWell Campus Healthcare — BULK Seed Data (Past 2 Months)
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================================================
-- Prerequisites: Run seed-users.js first to create staff auth accounts.
-- =============================================================================

DO $$
DECLARE
  v_doctor_id        uuid;
  v_pharmacy_id      uuid;
  v_insurance_id     uuid;
  v_medcenter_id     uuid;

`;

// Generate fixed UUIDs for students
const students = [];
for (let i = 1; i <= numStudents; i++) {
  const id = `aaaaaaaa-${i.toString().padStart(4, '0')}-0000-0000-000000000000`;
  const firstName = randomItem(firstNames);
  const lastName = randomItem(lastNames);
  const name = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@sau.edu.in`;
  students.push({ id, name, email });
  sql += `  v_s${i} uuid := '${id}';\n`;
}

sql += `\nBEGIN\n
  -- ── Look up existing staff profiles from seed-users.js ─────────────────
  SELECT p.id INTO v_doctor_id     FROM public.profiles p WHERE p.email = 'doctor@sau.edu.in' LIMIT 1;
  SELECT p.id INTO v_pharmacy_id   FROM public.profiles p WHERE p.email = 'pharmacy@sau.edu.in' LIMIT 1;
  SELECT p.id INTO v_insurance_id  FROM public.profiles p WHERE p.email = 'insurance@sau.edu.in' LIMIT 1;
  SELECT p.id INTO v_medcenter_id  FROM public.profiles p WHERE p.email = 'medicalcenter@sau.edu.in' LIMIT 1;
  
  IF v_doctor_id IS NULL OR v_pharmacy_id IS NULL THEN
    RAISE EXCEPTION 'Staff not found! Run seed-users.js first, then re-run this script.';
  END IF;

  -- ── Update existing staff profile details ──────────────────────────────
  UPDATE public.profiles SET phone = '+91 9800000001', college_id = 'STAFF-DOC1' WHERE email = 'doctor@sau.edu.in';
  UPDATE public.profiles SET phone = '+91 9800000002', college_id = 'STAFF-002' WHERE email = 'pharmacy@sau.edu.in';
  UPDATE public.profiles SET phone = '+91 9800000003', college_id = 'STAFF-003' WHERE email = 'insurance@sau.edu.in';
  UPDATE public.profiles SET phone = '+91 9800000004', college_id = 'STAFF-004' WHERE email = 'medicalcenter@sau.edu.in';

  -- ─────────────────────────────────────────────────────────────────────────
  -- STEP 1: Create student & doctor auth.users entries
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  VALUES\n`;

const doctorAuthValues = newDoctorsList.map((d, i) => {
  return `    ('${d.id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '${d.email}', '$2a$10$placeholder_hash_not_real', now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"${d.name}"}'::jsonb)`;
});
sql += doctorAuthValues.join(',\n') + `,\n`;

const authUserValues = students.map((s, i) => {
  return `    ('${s.id}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', '${s.email}', '$2a$10$placeholder_hash_not_real', now(), now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"${s.name}"}'::jsonb)`;
});
sql += authUserValues.join(',\n') + `\n  ON CONFLICT (id) DO NOTHING;\n\n`;


sql += `  -- ─────────────────────────────────────────────────────────────────────────
  -- STEP 2: Insert student & doctor profiles
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO public.profiles (id, name, email, roles, phone, class, branch, batch, college_id, blood_group, medical_conditions)
  VALUES\n`;

const doctorProfileValues = newDoctorsList.map((d, i) => {
  return `    ('${d.id}', '${d.name}', '${d.email}', ARRAY['doctor'], '${d.phone}', NULL, NULL, NULL, 'STAFF-DOC${i+2}', NULL, NULL)`;
});
sql += doctorProfileValues.join(',\n') + `,\n`;

const profileValues = students.map((s, i) => {
  const phone = `+91 98${randomInt(10000000, 99999999)}`;
  const cls = randomItem(classes);
  const branch = randomItem(branches);
  const batch = randomItem(batches);
  const collegeId = `SAU/${batch.split('-')[0]}/${randomInt(100, 999)}`;
  const bg = randomItem(bloodGroups);
  const med = randomItem(medicalConditions);
  const medStr = med === 'NULL' ? 'NULL' : `'${med}'`;
  return `    ('${s.id}', '${s.name}', '${s.email}', ARRAY['student'], '${phone}', '${cls}', '${branch}', '${batch}', '${collegeId}', '${bg}', ${medStr})`;
});
sql += profileValues.join(',\n') + `\n  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, roles = EXCLUDED.roles, phone = EXCLUDED.phone, class = EXCLUDED.class, branch = EXCLUDED.branch, batch = EXCLUDED.batch, college_id = EXCLUDED.college_id, blood_group = EXCLUDED.blood_group, medical_conditions = EXCLUDED.medical_conditions;\n\n`;

sql += `  -- ─────────────────────────────────────────────────────────────────────────
  -- STEP 3: Pharmacy Inventory
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO public.pharmacy_inventory (id, name, generic_name, category, quantity, unit, threshold, price_per_unit)
  VALUES
    (gen_random_uuid(), 'Paracetamol 500mg', 'Acetaminophen', 'Analgesic', 2400, 'tablets', 500, 2.50),
    (gen_random_uuid(), 'Amoxicillin 250mg', 'Amoxicillin', 'Antibiotic', 1200, 'capsules', 300, 8.00),
    (gen_random_uuid(), 'Cetirizine 10mg', 'Cetirizine', 'Antihistamine', 1800, 'tablets', 400, 3.00),
    (gen_random_uuid(), 'Ibuprofen 400mg', 'Ibuprofen', 'NSAID', 350, 'tablets', 500, 4.50),
    (gen_random_uuid(), 'ORS Sachets', 'ORS', 'Electrolyte', 2000, 'sachets', 300, 5.00),
    (gen_random_uuid(), 'Antacid Syrup', 'Magnesium Hydroxide', 'Antacid', 180, 'bottles', 200, 45.00)
  ON CONFLICT (id) DO NOTHING;\n\n`;


sql += `  -- ─────────────────────────────────────────────────────────────────────────
  -- STEP 4: Appointments
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO public.appointments ("userId", "doctorId", "doctorName", specialty, "timeSlot", date, status, notes)
  VALUES\n`;

const now = new Date();
const past60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
const future10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

const apptValues = [];
for (let i = 0; i < numAppointments; i++) {
  const d = randomDate(past60Days, future10Days);
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  const s = randomItem(students);
  const paramDoc = randomItem(allDoctorsPool);
  const spec = paramDoc.specialty;
  const docIdStr = paramDoc.isVariable ? paramDoc.id : `'${paramDoc.id}'`;
  const status = diffDays > 0 ? randomItem(['completed', 'completed', 'completed', 'cancelled']) : 'booked';
  
  let timeStr;
  if(diffDays > 0) {
      timeStr = `now() - interval '${diffDays} days'`;
  } else {
      timeStr = `now() + interval '${-diffDays} days'`;
  }
  
  apptValues.push(`    ('${s.id}', ${docIdStr}, '${paramDoc.name}', '${spec}', ${timeStr}, (${timeStr})::date, '${status}', '${randomItem(notesPool)}')`);
}
sql += apptValues.join(',\n') + `;\n\n`;


sql += `  -- ─────────────────────────────────────────────────────────────────────────
  -- STEP 5: Medical Records (Patient is student, Doctor is treating)
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO public.medical_records ("patientId", "doctorId", "doctorName", diagnosis, treatment, notes, "visitDate")
  VALUES\n`;
const recordValues = [];
for (let i = 0; i < numRecords; i++) {
  const d = randomDate(past60Days, now);
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  const s = randomItem(students);
  const paramDoc = randomItem(allDoctorsPool);
  const diag = randomItem(diagnoses);
  const treat = randomItem(treatments);
  const docIdStr = paramDoc.isVariable ? paramDoc.id : `'${paramDoc.id}'`;
  
  let timeStr = `now() - interval '${diffDays} days'`;
  recordValues.push(`    ('${s.id}', ${docIdStr}, '${paramDoc.name}', '${diag}', '${treat}', '${randomItem(notesPool)}', ${timeStr})`);
}
sql += recordValues.join(',\n') + `;\n\n`;


sql += `  -- ─────────────────────────────────────────────────────────────────────────
  -- STEP 6: Prescriptions
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO public.prescriptions ("patientId", "patientName", "doctorId", "doctorName", medicines, instructions, status, created_at)
  VALUES\n`;
const rxValues = [];
const medjson = `'[{"name":"Paracetamol 500mg","dosage":"1 tablet","duration":"5 days","qty":15}]'::jsonb`;
for (let i = 0; i < numPrescriptions; i++) {
  const d = randomDate(past60Days, now);
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  const s = randomItem(students);
  const paramDoc = randomItem(allDoctorsPool);
  const status = diffDays > 5 ? 'dispensed' : randomItem(['pending', 'dispensed']);
  const docIdStr = paramDoc.isVariable ? paramDoc.id : `'${paramDoc.id}'`;
  let timeStr = `now() - interval '${diffDays} days'`;
  rxValues.push(`    ('${s.id}', '${s.name}', ${docIdStr}, '${paramDoc.name}', ${medjson}, '${randomItem(notesPool)}', '${status}', ${timeStr})`);
}
sql += rxValues.join(',\n') + `;\n\n`;

sql += `  -- ─────────────────────────────────────────────────────────────────────────
  -- STEP 7: Pharmacy Orders
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO public.pharmacy_orders ("studentId", item_name, quantity_requested, status, notes, created_at)
  VALUES\n`;
const orderValues = [];
for (let i = 0; i < numOrders; i++) {
  const d = randomDate(past60Days, now);
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  const s = randomItem(students);
  const status = diffDays > 3 ? randomItem(['fulfilled', 'fulfilled', 'rejected']) : 'pending';
  let timeStr = `now() - interval '${diffDays} days'`;
  orderValues.push(`    ('${s.id}', 'Paracetamol 500mg', ${randomInt(1, 10)}, '${status}', 'Fever', ${timeStr})`);
}
sql += orderValues.join(',\n') + `;\n\n`;


sql += `  -- ─────────────────────────────────────────────────────────────────────────
  -- STEP 8: Insurance Claims
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO public.claims ("userId", amount, description, status, "createdAt", "updatedAt", "approvedAmount", "reviewNote", "reviewedBy")
  VALUES\n`;
const claimValues = [];
for (let i = 0; i < numClaims; i++) {
  const d = randomDate(past60Days, now);
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  const s = randomItem(students);
  const status = diffDays > 10 ? randomItem(['approved', 'approved', 'rejected']) : 'pending';
  let timeStr = `now() - interval '${diffDays} days'`;
  const amt = randomInt(500, 5000);
  
  if (status === 'approved') {
    claimValues.push(`    ('${s.id}', ${amt}, 'Medical Visit', '${status}', ${timeStr}, ${timeStr}, ${amt}, 'Approved', v_insurance_id)`);
  } else if (status === 'rejected') {
    claimValues.push(`    ('${s.id}', ${amt}, 'Medical Visit', '${status}', ${timeStr}, ${timeStr}, NULL, 'Rejected', v_insurance_id)`);
  } else {
    claimValues.push(`    ('${s.id}', ${amt}, 'Medical Visit', '${status}', ${timeStr}, NULL, NULL, NULL, NULL)`);
  }
}
sql += claimValues.join(',\n') + `;\n\n`;

sql += `  -- ─────────────────────────────────────────────────────────────────────────
  -- STEP 9: Medical Leave Applications
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO public.medical_leave ("studentId", from_date, to_date, reason, status, reviewed_by, review_note, created_at)
  VALUES\n`;
const leaveValues = [];
for (let i = 0; i < numLeaves; i++) {
  const d = randomDate(past60Days, now);
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  const s = randomItem(students);
  const status = diffDays > 5 ? randomItem(['approved', 'rejected']) : 'pending';
  let timeStr = `now() - interval '${diffDays} days'`;
  let timeStrEnd = `now() - interval '${diffDays - randomInt(1, 5)} days'`;
  
  if (status !== 'pending') {
    leaveValues.push(`    ('${s.id}', (${timeStr})::date, (${timeStrEnd})::date, 'Fever', '${status}', v_medcenter_id, 'Reviewed', ${timeStr})`);
  } else {
    leaveValues.push(`    ('${s.id}', (${timeStr})::date, (${timeStrEnd})::date, 'Fever', '${status}', NULL, NULL, ${timeStr})`);
  }
}
sql += leaveValues.join(',\n') + `;\n\n`;


sql += `  -- ─────────────────────────────────────────────────────────────────────────
  -- STEP 10: SOS Requests
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO public.sos_requests ("userId", "userName", "userPhone", "collegeId", lat, lng, accuracy, status, message, "resolvedBy", "resolvedNote", "resolvedAt", "ambulanceCalled")
  VALUES\n`;
const sosValues = [];
for (let i = 0; i < numSOS; i++) {
  const d = randomDate(past60Days, now);
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  const s = randomItem(students);
  const status = diffDays > 1 ? 'resolved' : 'active';
  let timeStr = `now() - interval '${diffDays} days'`;
  
  if(status === 'resolved') {
      sosValues.push(`    ('${s.id}', '${s.name}', '+91 9800000000', 'SAU/TEST', 28.6139, 77.2090, 10.0, '${status}', 'Medical Emergency', v_medcenter_id, 'Resolved', ${timeStr}, false)`);
  } else {
      sosValues.push(`    ('${s.id}', '${s.name}', '+91 9800000000', 'SAU/TEST', 28.6139, 77.2090, 10.0, '${status}', 'Medical Emergency', NULL, NULL, NULL, false)`);
  }
}
sql += sosValues.join(',\n') + `;\n\n`;


sql += `  RAISE NOTICE '✅ Bulk Seed complete! Students: ${numStudents} | Appts: ${numAppointments} | Records: ${numRecords} | Prescriptions: ${numPrescriptions} | Orders: ${numOrders} | Claims: ${numClaims} | Leave: ${numLeaves} | SOS: ${numSOS}';
END $$;\n`;

fs.writeFileSync('c:/Users/manan/OneDrive/Desktop/SAU/scripts/run-in-supabase-sql-editor.sql', sql);
console.log('SQL generated!');

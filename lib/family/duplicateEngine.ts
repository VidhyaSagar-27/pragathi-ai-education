/**
 * Pragathi AI — Family Clustering & Duplicate Application Detection Engine
 */

import {
  normalizePhone,
  normalizeEmail,
  normalizeStudentName,
  calculateNameSimilarity,
} from './normalization';
import {
  DatabaseSchema,
  Family,
  StudentRegistration,
  User,
  DuplicateAttemptLog,
} from '@/lib/db/types';

export interface DuplicateEvaluationResult {
  confidence: number;
  classification: 'VERY_LIKELY_DUPLICATE' | 'POSSIBLE_DUPLICATE' | 'NEW_CHILD';
  matchedRecord?: {
    id: string;
    type: 'REGISTRATION' | 'USER';
    studentName: string;
    classGrade?: string;
    schoolName?: string;
    parentPhone?: string;
    parentEmail?: string;
    familyId?: string;
  };
  matchSignals: string[];
  suggestedAction: 'BLOCK_AND_SHOW_EXISTING' | 'FLAG_FOR_ADMIN_REVIEW' | 'PROCEED_NEW_STUDENT';
}

/**
 * Evaluates duplicate risk for an incoming registration application against
 * all existing registrations and enrolled student users in the database.
 */
export function evaluateDuplicateRisk(
  candidate: {
    studentName: string;
    classGrade?: string;
    schoolName?: string;
    parentName?: string;
    mobileNumber?: string;
    email?: string;
    location?: string;
  },
  db: DatabaseSchema,
  excludeId?: string
): DuplicateEvaluationResult {
  const candName = candidate.studentName || '';
  const candPhone = normalizePhone(candidate.mobileNumber);
  const candEmail = normalizeEmail(candidate.email);
  const candGrade = String(candidate.classGrade || '').trim().toLowerCase();
  const candSchool = String(candidate.schoolName || '').trim().toLowerCase();
  const candParent = candidate.parentName || '';

  let highestConfidence = 0;
  let bestMatch: DuplicateEvaluationResult['matchedRecord'] | undefined;
  let bestSignals: string[] = [];

  // Helper to compare candidate against a single record
  const compareRecord = (
    rec: {
      id: string;
      type: 'REGISTRATION' | 'USER';
      studentName: string;
      classGrade?: string;
      schoolName?: string;
      parentName?: string;
      parentPhone?: string;
      parentEmail?: string;
      familyId?: string;
    }
  ) => {
    if (excludeId && rec.id === excludeId) return;

    const recPhone = normalizePhone(rec.parentPhone);
    const recEmail = normalizeEmail(rec.parentEmail);
    const recGrade = String(rec.classGrade || '').trim().toLowerCase();
    const recSchool = String(rec.schoolName || '').trim().toLowerCase();

    const phoneMatches = Boolean(candPhone && recPhone && candPhone === recPhone);
    const emailMatches = Boolean(candEmail && recEmail && candEmail === recEmail);
    const contactMatches = phoneMatches || emailMatches;

    // SECTION 4: DO NOT USE STUDENT NAME ALONE
    // If neither parent phone nor parent email matches, they MUST NOT be marked as duplicate!
    // Rahul Kumar (Phone A) vs Rahul Kumar (Phone B) are likely different students.
    if (!contactMatches) {
      return;
    }

    const signals: string[] = [];
    let score = 0;

    // 1. Strong Signals: Parent Contact
    if (phoneMatches && emailMatches) {
      score += 55;
      signals.push('Matching Parent Phone & Parent Email (+55%)');
    } else if (phoneMatches) {
      // If candidate or record has no email provided, phone match carries full contact weight
      const hasEmailOnBoth = Boolean(candEmail && recEmail);
      const phoneWeight = hasEmailOnBoth ? 35 : 55;
      score += phoneWeight;
      signals.push(`Matching Parent Mobile Phone (+${phoneWeight}%)`);
    } else if (emailMatches) {
      const hasPhoneOnBoth = Boolean(candPhone && recPhone);
      const emailWeight = hasPhoneOnBoth ? 30 : 50;
      score += emailWeight;
      signals.push(`Matching Parent Email (+${emailWeight}%)`);
    }

    // 2. Strong Signal: Student Name Similarity
    const nameSim = calculateNameSimilarity(candName, rec.studentName);
    if (nameSim >= 0.98) {
      score += 40;
      signals.push('Identical / Inverted Student Name Match (+40%)');
    } else if (nameSim >= 0.88) {
      score += 30;
      signals.push(`High Student Name Similarity (${Math.round(nameSim * 100)}% token/initial match) (+30%)`);
    } else if (nameSim >= 0.75) {
      score += 18;
      signals.push(`Partial Student Name Similarity (${Math.round(nameSim * 100)}%) (+18%)`);
    } else {
      // Distinct name (e.g. Rahul vs Priya) -> genuine sibling!
      signals.push(`Distinct Student Names (${Math.round(nameSim * 100)}% similarity)`);
    }

    // 3. Supporting Signals
    if (candGrade && recGrade && candGrade === recGrade) {
      score += 5;
      signals.push('Matching Class / Grade (+5%)');
    }

    if (candSchool && recSchool && (candSchool.includes(recSchool) || recSchool.includes(candSchool))) {
      score += 5;
      signals.push('Matching School (+5%)');
    }

    if (candParent && rec.parentName) {
      const parentSim = calculateNameSimilarity(candParent, rec.parentName);
      if (parentSim >= 0.85) {
        score += 5;
        signals.push('Matching Parent / Guardian Name (+5%)');
      }
    }

    // Cap score at 100
    score = Math.min(100, Math.max(0, score));

    // Per specifications (Section 5 & 9): Non-identical name variations (e.g. initials "Rahul K" vs "Rahul Kumar"
    // or minor spelling differences) must NEVER be automatically declared duplicate.
    // Cap score at 90% so they reliably route to Admin Review (80-94% range).
    if (nameSim < 0.98 && nameSim >= 0.75) {
      score = Math.min(90, score);
    }

    if (score > highestConfidence) {
      highestConfidence = score;
      bestMatch = rec;
      bestSignals = signals;
    }
  };

  // Compare against registrations
  for (const reg of db.registrations || []) {
    compareRecord({
      id: reg.id,
      type: 'REGISTRATION',
      studentName: reg.studentName,
      classGrade: reg.classGrade,
      schoolName: reg.schoolName,
      parentName: reg.parentName,
      parentPhone: reg.mobileNumber,
      parentEmail: reg.email,
      familyId: reg.familyId,
    });
  }

  // Compare against enrolled students in db.users
  for (const user of db.users || []) {
    if (user.role === 'STUDENT') {
      compareRecord({
        id: user.id,
        type: 'USER',
        studentName: user.name,
        classGrade: user.studentDetails?.classGrade,
        schoolName: user.studentDetails?.schoolName,
        parentName: user.studentDetails?.parentName,
        parentPhone: user.studentDetails?.parentPhone || user.phone,
        parentEmail: user.studentDetails?.parentEmail || (user.email.endsWith('@pragathiai.student') ? undefined : user.email),
        familyId: user.studentDetails?.familyId,
      });
    }
  }

  // Classification Thresholds:
  // >= 95% -> Very Likely Duplicate
  // 80% - 94% -> Possible Duplicate (Admin Review)
  // < 80% -> New Child from Same Family (or New Family)
  let classification: DuplicateEvaluationResult['classification'] = 'NEW_CHILD';
  let suggestedAction: DuplicateEvaluationResult['suggestedAction'] = 'PROCEED_NEW_STUDENT';

  if (highestConfidence >= 95) {
    classification = 'VERY_LIKELY_DUPLICATE';
    suggestedAction = 'BLOCK_AND_SHOW_EXISTING';
  } else if (highestConfidence >= 80) {
    classification = 'POSSIBLE_DUPLICATE';
    suggestedAction = 'FLAG_FOR_ADMIN_REVIEW';
  }

  return {
    confidence: highestConfidence,
    classification,
    matchedRecord: bestMatch,
    matchSignals: bestSignals,
    suggestedAction,
  };
}

/**
 * Finds existing Family or creates a new Family based on parent contact info.
 * Implements TRANSITIVE MATCHING:
 * If Student A has Phone A + Email A, and Student B has Phone A + Email B,
 * and Student C has Phone C + Email B -> All 3 belong to the SAME family.
 */
export function getOrCreateTransitiveFamily(
  db: DatabaseSchema,
  details: {
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    studentId?: string;
    registrationId?: string;
  }
): Family {
  if (!db.families) {
    db.families = [];
  }

  const cleanPhone = normalizePhone(details.parentPhone);
  const cleanEmail = normalizeEmail(details.parentEmail);

  // Find all existing families that match on phone OR email
  const matchingFamilies: Family[] = [];

  for (const fam of db.families) {
    const hasPhone = cleanPhone && fam.parentPhones?.some((p) => normalizePhone(p) === cleanPhone);
    const hasEmail = cleanEmail && fam.parentEmails?.some((e) => normalizeEmail(e) === cleanEmail);

    if (hasPhone || hasEmail) {
      matchingFamilies.push(fam);
    }
  }

  let canonicalFamily: Family;

  if (matchingFamilies.length === 0) {
    // Check if any existing student or registration matches this phone or email
    // to link with them transitively
    let existingFamId: string | undefined;

    for (const u of db.users || []) {
      if (u.role === 'STUDENT') {
        const uPhone = normalizePhone(u.studentDetails?.parentPhone || u.phone);
        const uEmail = normalizeEmail(u.studentDetails?.parentEmail);
        if ((cleanPhone && uPhone === cleanPhone) || (cleanEmail && uEmail === cleanEmail)) {
          if (u.studentDetails?.familyId) {
            existingFamId = u.studentDetails.familyId;
            break;
          }
        }
      }
    }

    if (!existingFamId) {
      for (const r of db.registrations || []) {
        const rPhone = normalizePhone(r.mobileNumber);
        const rEmail = normalizeEmail(r.email);
        if ((cleanPhone && rPhone === cleanPhone) || (cleanEmail && rEmail === cleanEmail)) {
          if (r.familyId) {
            existingFamId = r.familyId;
            break;
          }
        }
      }
    }

    if (existingFamId) {
      canonicalFamily = db.families.find((f) => f.id === existingFamId)!;
    } else {
      // Create fresh new family
      const famCount = (db.families.length + 1).toString().padStart(3, '0');
      canonicalFamily = {
        id: `fam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        familyName: details.parentName ? `${details.parentName} Family` : `Family FAM${famCount}`,
        parentName: details.parentName || 'Parent / Guardian',
        parentPhones: cleanPhone ? [cleanPhone] : [],
        parentEmails: cleanEmail ? [cleanEmail] : [],
        studentIds: [],
        registrationIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.families.push(canonicalFamily);
    }
  } else if (matchingFamilies.length === 1) {
    canonicalFamily = matchingFamilies[0];
  } else {
    // TRANSITIVE MERGE: Multiple families bridged by this new contact!
    // Merge matching families into the first one and remove the others
    canonicalFamily = matchingFamilies[0];
    for (let i = 1; i < matchingFamilies.length; i++) {
      const otherFam = matchingFamilies[i];
      // Merge phones & emails
      for (const p of otherFam.parentPhones || []) {
        if (!canonicalFamily.parentPhones.includes(p)) canonicalFamily.parentPhones.push(p);
      }
      for (const e of otherFam.parentEmails || []) {
        if (!canonicalFamily.parentEmails.includes(e)) canonicalFamily.parentEmails.push(e);
      }
      // Merge student and registration IDs
      for (const sid of otherFam.studentIds || []) {
        if (!canonicalFamily.studentIds.includes(sid)) canonicalFamily.studentIds.push(sid);
      }
      for (const rid of otherFam.registrationIds || []) {
        if (!canonicalFamily.registrationIds.includes(rid)) canonicalFamily.registrationIds.push(rid);
      }

      // Update references in users & registrations
      for (const u of db.users || []) {
        if (u.studentDetails?.familyId === otherFam.id) {
          u.studentDetails.familyId = canonicalFamily.id;
        }
      }
      for (const r of db.registrations || []) {
        if (r.familyId === otherFam.id) {
          r.familyId = canonicalFamily.id;
        }
      }

      // Remove other merged family
      db.families = db.families.filter((f) => f.id !== otherFam.id);
    }
  }

  // Ensure contact values are present in canonical family
  if (cleanPhone && !canonicalFamily.parentPhones.includes(cleanPhone)) {
    canonicalFamily.parentPhones.push(cleanPhone);
  }
  if (cleanEmail && !canonicalFamily.parentEmails.includes(cleanEmail)) {
    canonicalFamily.parentEmails.push(cleanEmail);
  }
  if (details.parentName && (!canonicalFamily.parentName || canonicalFamily.parentName === 'Parent / Guardian')) {
    canonicalFamily.parentName = details.parentName;
    canonicalFamily.familyName = `${details.parentName} Family`;
  }
  if (details.studentId && !canonicalFamily.studentIds.includes(details.studentId)) {
    canonicalFamily.studentIds.push(details.studentId);
  }
  if (details.registrationId && !canonicalFamily.registrationIds.includes(details.registrationId)) {
    canonicalFamily.registrationIds.push(details.registrationId);
  }

  canonicalFamily.updatedAt = new Date().toISOString();
  return canonicalFamily;
}

/**
 * Synchronizes and backfills Family clustering and sequential studentCode across
 * all existing registrations and enrolled students.
 * Safe to call idempotently on database initialization.
 */
export function syncAllFamilies(db: DatabaseSchema): void {
  if (!db.families) db.families = [];
  if (!db.duplicateLogs) db.duplicateLogs = [];

  let studentCounter = 1;

  // 1. Process all existing users (students)
  for (const user of db.users || []) {
    if (user.role === 'STUDENT') {
      if (!user.studentDetails) {
        user.studentDetails = {
          classGrade: '6',
          schoolName: 'Pragathi AI Academy',
          parentName: 'Parent',
          location: 'Hyderabad',
          group: 'Foundation Batch A',
        };
      }

      // Assign studentCode if missing
      if (!user.studentDetails.studentCode) {
        user.studentDetails.studentCode = `STU${studentCounter.toString().padStart(3, '0')}`;
        studentCounter++;
      }

      const pPhone = user.studentDetails.parentPhone || user.phone;
      const pEmail = user.studentDetails.parentEmail || (user.email.endsWith('@pragathiai.student') ? undefined : user.email);

      const fam = getOrCreateTransitiveFamily(db, {
        parentName: user.studentDetails.parentName,
        parentPhone: pPhone,
        parentEmail: pEmail,
        studentId: user.id,
      });

      user.studentDetails.familyId = fam.id;
      user.studentDetails.parentPhone = normalizePhone(pPhone);
      if (pEmail) user.studentDetails.parentEmail = normalizeEmail(pEmail);
    }
  }

  // 2. Process all existing registrations
  for (const reg of db.registrations || []) {
    if (!reg.duplicateStatus) reg.duplicateStatus = 'NONE';

    const fam = getOrCreateTransitiveFamily(db, {
      parentName: reg.parentName,
      parentPhone: reg.mobileNumber,
      parentEmail: reg.email,
      registrationId: reg.id,
    });

    reg.familyId = fam.id;
    if (!reg.studentCode) {
      reg.studentCode = `STU${studentCounter.toString().padStart(3, '0')}`;
      studentCounter++;
    }
  }
}

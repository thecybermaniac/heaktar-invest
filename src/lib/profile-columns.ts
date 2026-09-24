import type { Profile } from "@/lib/app-store";

// camelCase Profile field -> snake_case profiles table column. Used by profile.server.ts to
// read a row into a Profile, and by auth.tsx's saveProfile to write one back — kept in one
// place so the two never drift apart.
export const PROFILE_COLUMNS: Record<keyof Profile, string> = {
  firstName: "first_name",
  lastName: "last_name",
  email: "email",
  avatarUrl: "avatar_url",
  referralCode: "referral_code",
  dob: "dob",
  gender: "gender",
  nationality: "nationality",
  state: "state",
  city: "city",
  address: "address",
  idType: "id_type",
  idNumber: "id_number",
  occupation: "occupation",
  employmentStatus: "employment_status",
  sourceOfFunds: "source_of_funds",
  experience: "experience",
  riskTolerance: "risk_tolerance",
};

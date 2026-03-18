# 🎾 AcaPadel — Court Booking App

A full-stack padel court booking app built with **Next.js 14** and **Supabase**.

## Features

- 🗓️ **Date picker** — browse availability up to 2 weeks ahead
- 🏟️ **Multi-court support** — indoor & outdoor courts with individual availability
- ⏱️ **60-minute sessions** — time slots from 07:00 to 20:00 (configurable)
- 🔐 **Auth** — email/password sign up + sign in via Supabase Auth
- 📋 **My Bookings** — view upcoming bookings and cancel them
- ⚡ **Double-booking prevention** — enforced at the database level with an exclusion constraint
- 🌑 **Dark theme** — clean, sporty design

---

## Quick Start

### 1. Clone & install

```bash
git clone AcademiaPadelBookingSystem
cd AcademiaPadelBookingSystem
npm install
```

### 2. Create a Supabase project
Note: the schema file is currently outdated, and won't configure the DB properly for this app

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the full contents of `supabase/schema.sql`
3. Courts are seeded automatically by the schema

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in your values from **Supabase Dashboard → Settings → API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

### 4. Enable Email Auth in Supabase

Go to **Authentication → Providers → Email** and make sure it's enabled.
For local dev you can disable email confirmation under **Auth → Settings → Email confirmations**.

### 5. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout + metadata
│   ├── page.tsx            # Main booking page
│   └── globals.css         # All styles (CSS variables + components)
├── components/
│   ├── CourtCard.tsx       # Court with time slot grid
│   ├── BookingModal.tsx    # Confirm a booking
│   ├── MyBookings.tsx      # List + cancel user's bookings
│   └── AuthForm.tsx        # Sign in / sign up form
├── hooks/
│   └── useAuth.ts          # Auth state + helpers
└── lib/
    ├── supabase.ts         # Typed Supabase client
    └── timeSlots.ts        # Slot generation helpers
supabase/
└── schema.sql              # Full DB schema — run this first
```

---

## Customisation

| What | Where |
|------|-------|
| Session duration (default 60 min) | `.env.local` → `NEXT_PUBLIC_SLOT_DURATION` |
| Booking slots (time between possible bookings) | `.env.local` → `NEXT_PUBLIC_SLOT_STEP` |
| Opening / closing hours | `.env.local` → `NEXT_PUBLIC_OPEN_TIME`, `NEXT_PUBLIC_CLOSE_TIME` |
| Maximum concurrent bookings per user | `.env.local` → `NEXT_PUBLIC_MAXIMUM_BOOKINGS` |
| How far ahead users can book | `.env.local` → `NEXT_PUBLIC_MAX_ADVANCE_BOOKING_DAYS` |
| Application title | `.env.local` → `NEXT_PUBLIC_APPLICATION_TITLE` |
| Courts list | Run SQL `INSERT INTO courts ...` or add an admin panel |
| Colors & fonts | `src/app/globals.css` → `:root` variables |

---

## Database Schema

- **profiles** — extends Supabase auth users, auto-created on signup
- **courts** — name, indoor/outdoor flag, active flag
- **bookings** — links user + court + date + time, with a database-level overlap exclusion constraint so double-bookings are impossible even under concurrent requests

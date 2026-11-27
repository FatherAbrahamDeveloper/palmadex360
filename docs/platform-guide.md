# Palmadex 360 platform guide (25 Nov 2026)

This release brings the full platform (roles and permissions, verified sign-up with face photos, Customer Portal, Communication Centre, Support, Knowledge Base, Reports) to PostgreSQL on Neon and Render, in Palmadex branding, and adds commodity quality checks to Procurement.

## 1. Running and deploying

See `docs/deployment-guide.md` for Neon, Render, Vercel and email (Brevo), and for running it locally.

## 2. Quality checks (QA/QC) in Procurement

New in Palmadex 360. Procurement now has three tabs: **Purchase requests**, **Quality checks** and **Checklists**.

### Checklists (templates)

One checklist per commodity. Seven are created the first time anyone opens Quality checks:

- **Hibiscus Flower Loading QA/QC Checklist**, matching the paper form row for row.
- Drafts for **sesame seed, cocoa beans, raw cashew nuts, dried split ginger, gum arabic and hardwood charcoal**. These use common export specifications as a starting point; check every limit against your buyer contracts and edit before relying on them.

Users with **Full** Procurement access (Super Admin, Administrator, Procurement) can add, edit, duplicate or switch off checklists under **Checklists**. A checklist that has already been used is switched off instead of deleted, and editing its rows raises its version number. Submitted checks always keep the rows they were filled with.

Rows work like this:

| Type | How it is filled | When it fails |
|---|---|---|
| Tick one option | Tick one option, as on paper | Never, unless the option is marked "not acceptable" |
| Tick one option + measured value | Tick the contracted spec (e.g. moisture 10-12%) and type the meter reading | The reading is outside the ticked spec |
| Yes / No requirement | Yes or No (e.g. free from moulds and insects) | No |
| Measured value | Type the reading; the row has a minimum and/or maximum | Outside the limits |
| Free text | Text (e.g. source state and LGA) | Never |

Any row can be set to "Failing blocks loading" (critical) or recorded only.

On the hibiscus checklist, purity, moisture, broken flowers, foreign matter and admixture take a measured value; colour, packaging, total weight, number of bags and type are recorded as ticked; quality, means of cleaning and type of bag are Yes/No; source is free text.

### Filling a check

1. **Quality checks > New quality check** (or **New check** inside a purchase request).
2. Choose the checklist (it is picked automatically from the purchase request's item), and optionally link the purchase request and the shipment. Enter the container number, crop year and date.
3. Tick and type as on the paper form. Each row turns green or red as you go.
4. Save as a draft at any time. To submit, every required row must be filled, the inspector's name entered, and the confirmation ticked (this is the electronic signature).
5. **Print** gives a copy laid out like the paper form, with the Palmadex logo.

### When a check fails

- The check is recorded as **Failed** with the reason for each failed row (for example "Moisture content: Measured 13.4% is outside the ticked spec 10-12%").
- The linked purchase request **cannot be marked completed**, and the linked shipment **cannot move to Loading, At sea, Customs or Arrived**. Anyone who tries sees which check failed and is asked to contact an administrator.
- Administrators and Super Admins get an in-app notification and an email.
- An **Administrator or Super Admin** can open the check and **override** it with a written reason. The check then shows "Released by admin", with who released it, when and why, and loading can continue.
- Alternatively, re-inspect the container (for example after re-cleaning): a newer check of the same container that passes replaces the failure.
- Submitted checks cannot be edited or deleted. They stay as the record.

## 3. Roles and permissions (RBAC)

Every module has four access levels per role: **None**, **View** (read only), **Edit** (create and update), **Full** (also delete and approve). The API checks them on every request; the menu, dashboard cards, search and quick actions only show what the role can open.

| Role | Purpose |
|---|---|
| Super Admin | Everything. Only role that can change the permission matrix or manage other admins. |
| Administrator | Runs operations and manages users, but cannot change Super Admins or the matrix. |
| Export Manager | Orders and shipping end to end, plus most operations. |
| Sales | CRM and orders; read access to products, suppliers, shipping, reports. |
| Logistics | Shipping, inventory, documents. |
| Documentation | Documents and trade compliance; edits help articles. |
| Customer Support | Support tickets (full), knowledge base, read access to orders and shipping. |
| Finance (new) | Finance (full), reports, read access to orders and procurement. |
| Procurement (new) | Procurement (full), suppliers. |
| Warehouse (new) | Inventory (full), read access to products and shipping. |
| Viewer (new) | Read-only everywhere except user management. For auditors and management. |
| Customer (new) | External buyer: Customer Portal, messages, own support tickets, public help articles. Never sees internal modules. |

Change any role's access in **User & Access Management > Roles & permissions**. "Defaults" restores a role.

Safety rules built in: you cannot change your own role or deactivate yourself, there is always at least one active Super Admin, and only a Super Admin can create or edit administrators.

## 4. Registration, verification and approval

1. A person registers as a buyer or as staff, and takes a face photo with their camera (step 2 of the form).
2. They verify their email from the link sent to them.
3. Admins get an in-app notification and an email. In **User & Access Management**, the admin checks the details and the face photo, picks the role (and, for buyers, the customer record, created automatically if needed) and approves. The person is emailed.
4. They can now sign in.

Also available: invite a user (they set their own password from an email), resend verification, mark verified, password reset by email, unlock after 5 failed attempts (15-minute lock), sign a user out everywhere, optional two-step sign-in with an authenticator app (**My account & security**).

The very first account in an empty database becomes the Super Admin automatically, so a fresh install never locks you out.

## 5. Face photos

- Taken in the browser with the device camera during sign-up. Existing accounts without one are asked once, the next time they sign in.
- Used only for an administrator to confirm who they are dealing with. **No automatic face recognition, and it is not used to sign in.**
- Stored in the database (table `FaceImage`), never in a public folder. Only the account owner and users with User & Access Management access can view it. Admins mark each photo Verified or Rejected; a rejected person is asked to retake it.
- Under the Nigeria Data Protection Act 2023, facial images are sensitive (biometric) personal data. The form shows a notice and requires explicit consent before upload. Before going live, add this use to your privacy notice, set a retention period, and treat database backups as containing personal data.
- Switch the requirement off with `FACE_ENROLLMENT_REQUIRED=false`.

## 6. Modules completed

- **Customer Portal**: buyers browse active products, place export orders (minimum order and price checks; staff are notified), cancel pending orders, track shipments with a step timeline, see invoices and balances, download shared documents. Staff manage customer records and can open any customer's portal view. Customers are notified (in-app and email) when their order or shipment status changes.
- **Communication Centre**: real-time messaging with Socket.IO (runs on the Render service). Direct, group and "Palmadex team" enquiry conversations, attachments, typing indicator, read receipts, unread badges, edit and delete. People who are offline get an email (at most every 30 minutes per conversation). Imported WhatsApp history stays on the CRM contact page.
- **Documents**: uploads are stored in the database (up to 15 MB each, set by `MAX_UPLOAD_MB`), so they survive Render restarts. Links to files carry a signed token that expires after 30 minutes.
- **Support & Ticketing**: ticket numbers (TKT-2026-0001), categories, priorities, assignment, internal notes, status workflow, resolution summary, reopen, statistics, and suggested help articles while typing. Email and in-app notifications at each step.
- **Knowledge Base**: categories, articles, FAQs, guides and tutorials, drafts and publishing, staff-only articles, search, views, "was this helpful", related articles.
- **Reports & Analytics**: period selector, KPIs with month-on-month change, monthly performance chart, top customers, products and markets, status breakdowns, actionable alerts, a monthly report, CSV export of 8 datasets, print to PDF.
- **Dashboard**: five live cards (CRM contacts first), alerts, live activity feed and quick actions, all based on the user's permissions. Customers see their own figures.
- **Search**: one search bar in the top bar for modules and records across every module the user can view.
- **Notifications**: bell with live count and dropdown.

## 7. Tested

On PostgreSQL 16 with a fresh database built from the migration: 81 API checks covering registration and approval, face photos and documents stored in the database, case-insensitive search, every module's main list, the full quality-check cycle (pass, fail with reasons, admin notification, purchase request and shipment blocking, refused and accepted overrides, re-inspection, replaced failures), checklist management and permission limits. In the browser: a hibiscus checklist filled and submitted by a Procurement user, the live red row, the failure banner, the admin override panel and the printed form.

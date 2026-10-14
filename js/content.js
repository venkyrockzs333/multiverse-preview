/* Configurable content for THE MULTIVERSE preview.
   Items with verified:false are NOT rendered. Flip to true only after Venkateshwarlu confirms them. */
export const contact = {
  email: 'venkateshwarluboda1806@gmail.com',             // verified: live site + resume
  linkedin: 'https://www.linkedin.com/in/venkateshwarlu-boda-901b50270/', // verified: live site + resume
  phone: { value: null, showPublicly: false },           // intentionally never rendered
};
export const unverifiedTools = [
  { name: 'PowerShell', verified: false },
  { name: 'Windows Update testing', verified: false },
  { name: 'Visual Studio', verified: false },
];
const list = document.getElementById('tools-list');
if (list) for (const t of unverifiedTools.filter((t) => t.verified)) {
  const li = document.createElement('li'); li.textContent = t.name; list.appendChild(li);
}

/* CRM: no codebase/files are available, so no feature is evidenced. Nothing below is rendered. */
export const crm = {
  stack: ['Python', 'Flask', 'SQLAlchemy', 'MySQL', 'PyMySQL', 'HTML', 'CSS', 'JavaScript', 'Bootstrap', 'Fetch API', 'Flask-Migrate / Alembic'], // confirmed
  dates: null,
  features: [ // previously shown on the site; removed pending confirmation
    { text: 'Create, view, update and delete records through Flask routes (full CRUD)', verified: false },
    { text: 'Pages update without full reloads via asynchronous Fetch API requests', verified: false },
    { text: 'Responsive interface built with Bootstrap', verified: false },
    { text: 'Test approach: functional, form validation, CRUD, boundary, negative, DB and UI checks', verified: false },
  ],
};
/* IoT: public content limited to verified items. Unknowns stay null and are never rendered. */
export const iot = { board: null, wifiModule: null, teamSize: null, year: null };

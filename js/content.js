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

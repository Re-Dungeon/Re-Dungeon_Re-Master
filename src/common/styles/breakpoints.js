// Único ponto de corte "celular" do Re:Master: abaixo de 600px (o `down('sm')`
// do MUI). A partir de 600px nada muda — nem CSS, nem JSX.
export const MOBILE_MEDIA = '(max-width: 599.95px)';
export const MOBILE_QUERY = `@media ${MOBILE_MEDIA}`;

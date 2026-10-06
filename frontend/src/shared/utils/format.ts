export const shortId = (uuid: string) => uuid.slice(0, 8);

export const time = (date: string) =>
  new Date(date).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' });
export const dateLabel = (date: string) =>
  new Date(date).toLocaleDateString('el-GR', { day: 'numeric', month: 'long' });

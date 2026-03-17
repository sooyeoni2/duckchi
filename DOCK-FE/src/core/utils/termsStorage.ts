import * as FileSystem from 'expo-file-system';

const TERMS_FILE = FileSystem.documentDirectory + 'terms_agreed.json';

async function readData(): Promise<Record<string, boolean>> {
  try {
    const content = await FileSystem.readAsStringAsync(TERMS_FILE);
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function isTermsAgreed(userId: number): Promise<boolean> {
  const data = await readData();
  return data[String(userId)] === true;
}

export async function setTermsAgreed(userId: number): Promise<void> {
  const data = await readData();
  data[String(userId)] = true;
  await FileSystem.writeAsStringAsync(TERMS_FILE, JSON.stringify(data));
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const clientId = process.env.PLUGGY_CLIENT_ID || '';
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET || '';

  return NextResponse.json({
    clientId,
    hasSecret: !!clientSecret
  });
}

export async function POST(request: Request) {
  try {
    const { clientId, clientSecret } = await request.json();
    
    const envPath = path.join(process.cwd(), '.env.local');
    
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf-8');
    }

    const updateEnv = (content: string, key: string, value: string) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${value}`);
      } else {
        return content + (content.endsWith('\n') || content === '' ? '' : '\n') + `${key}=${value}`;
      }
    };

    if (clientId !== undefined) {
      envContent = updateEnv(envContent, 'PLUGGY_CLIENT_ID', clientId);
      process.env.PLUGGY_CLIENT_ID = clientId;
    }
    
    if (clientSecret && clientSecret !== '••••••••••••••••') {
      envContent = updateEnv(envContent, 'PLUGGY_CLIENT_SECRET', clientSecret);
      process.env.PLUGGY_CLIENT_SECRET = clientSecret;
    }

    fs.writeFileSync(envPath, envContent.trim() + '\n');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

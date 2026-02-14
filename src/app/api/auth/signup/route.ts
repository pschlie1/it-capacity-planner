import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  orgName: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password, name, orgName } = parsed.data;

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    // Create slug from org name
    const slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    // Check if org slug exists
    const existingOrg = await prisma.organization.findUnique({ where: { slug } });
    if (existingOrg) {
      return NextResponse.json({ error: 'Organization name already taken' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Create org and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: orgName,
          slug,
          holidays: [
            { name: 'New Year', week: 1 }, { name: 'MLK Day', week: 3 },
            { name: 'Presidents Day', week: 8 }, { name: 'Memorial Day', week: 22 },
            { name: 'Independence Day', week: 27 }, { name: 'Labor Day', week: 36 },
            { name: 'Thanksgiving', week: 48 }, { name: 'Christmas', week: 52 },
          ],
          roleTemplates: [
            { name: 'Small Team', roles: { architect: 0.5, developer: 2, qa: 0.5, devops: 0.5 } },
            { name: 'Medium Team', roles: { pm: 0.5, architect: 1, developer: 4, qa: 1.5, devops: 1, businessAnalyst: 0.5 } },
            { name: 'Large Team', roles: { pm: 1, productManager: 0.5, architect: 1.5, developer: 6, qa: 2, devops: 1.5, dba: 1, businessAnalyst: 1 } },
          ],
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: 'OWNER',
          orgId: org.id,
        },
      });

      return { org, user };
    });

    return NextResponse.json({
      success: true,
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
      org: { id: result.org.id, name: result.org.name, slug: result.org.slug },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

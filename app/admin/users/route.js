import { redirect } from 'next/navigation';
import { query } from '../../../lib/db';
import { getCurrentUser, hashPassword } from '../../../lib/auth';

function texto(valor) {
  return String(valor || '').trim();
}

export async function POST(request) {
  const user = await getCurrentUser();

  if (!user || user.papel !== 'nexora_admin') {
    redirect('/admin');
  }

  const formData = await request.formData();

  const empresaId = Number(formData.get('empresa_id'));
  const nome = texto(formData.get('nome'));
  const email = texto(formData.get('email')).toLowerCase();
  const senha = texto(formData.get('senha'));

  if (!empresaId || !nome || !email || !senha) {
    redirect('/admin');
  }

  const empresa = await query(
    `SELECT id, slug
     FROM food_empresas
     WHERE id = $1
     LIMIT 1`,
    [empresaId]
  );

  const empresaAtual = empresa.rows[0];

  if (!empresaAtual) {
    redirect('/admin');
  }

  const senhaHash = hashPassword(senha);

  await query(
    `INSERT INTO food_usuarios (
       empresa_id,
       nome,
       email,
       senha_hash,
       papel,
       ativo
     )
     VALUES ($1, $2, $3, $4, 'empresa_admin', true)
     ON CONFLICT (email) DO UPDATE SET
       empresa_id = EXCLUDED.empresa_id,
       nome = EXCLUDED.nome,
       senha_hash = EXCLUDED.senha_hash,
       papel = 'empresa_admin',
       ativo = true`,
    [
      empresaId,
      nome,
      email,
      senhaHash
    ]
  );

  redirect(`/admin?slug=${empresaAtual.slug}`);
}

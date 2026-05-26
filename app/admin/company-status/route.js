import { redirect } from 'next/navigation';
import { query } from '../../../lib/db';
import { getCurrentUser } from '../../../lib/auth';

export async function POST(request) {
  const user = await getCurrentUser();

  if (!user || user.papel !== 'nexora_admin') {
    redirect('/admin');
  }

  const formData = await request.formData();

  const empresaId = Number(formData.get('empresa_id'));
  const acao = String(formData.get('acao') || '');

  if (!empresaId || !['bloquear', 'desbloquear'].includes(acao)) {
    redirect('/admin');
  }

  if (acao === 'bloquear') {
    await query(
      `UPDATE food_empresas
       SET
         bloqueado = true,
         bloqueado_motivo = 'mensalidade_pendente',
         bloqueado_em = NOW()
       WHERE id = $1`,
      [empresaId]
    );
  }

  if (acao === 'desbloquear') {
    await query(
      `UPDATE food_empresas
       SET
         bloqueado = false,
         bloqueado_motivo = NULL,
         bloqueado_em = NULL
       WHERE id = $1`,
      [empresaId]
    );
  }

  const empresas = await query(
    `SELECT slug FROM food_empresas WHERE id = $1 LIMIT 1`,
    [empresaId]
  );

  const slug = empresas.rows[0]?.slug;

  redirect(slug ? `/admin?slug=${slug}` : '/admin');
}

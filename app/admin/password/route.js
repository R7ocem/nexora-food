import { redirect } from 'next/navigation';
import { query } from '../../../lib/db';
import { getCurrentUser, hashPassword } from '../../../lib/auth';

function texto(valor) {
  return String(valor || '').trim();
}

export async function POST(request) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/admin');
  }

  const formData = await request.formData();

  const senhaNova = texto(formData.get('senha_nova'));
  const confirmarSenha = texto(formData.get('confirmar_senha'));

  if (!senhaNova || senhaNova.length < 8 || senhaNova !== confirmarSenha) {
    redirect('/admin?erro=senha');
  }

  const senhaHash = hashPassword(senhaNova);

  await query(
    `UPDATE food_usuarios
     SET senha_hash = $2
     WHERE id = $1`,
    [user.id, senhaHash]
  );

  redirect('/admin?senha=alterada');
}

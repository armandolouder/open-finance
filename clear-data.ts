import { prisma } from './src/services/db';

async function clearData() {
  console.log('🧹 Iniciando limpeza dos dados sincronizados...');

  try {
    // Apaga os dados na ordem correta para não ferir relações entre tabelas
    await prisma.syncLog.deleteMany();
    console.log('✅ Logs de sincronização apagados.');

    await prisma.transaction.deleteMany();
    console.log('✅ Transações apagadas.');

    await prisma.creditCardBill.deleteMany();
    console.log('✅ Faturas de cartão apagadas.');

    await prisma.creditCard.deleteMany();
    console.log('✅ Cartões de crédito apagados.');

    await prisma.investment.deleteMany();
    console.log('✅ Investimentos apagados.');

    await prisma.account.deleteMany();
    console.log('✅ Contas apagadas.');

    await prisma.connection.deleteMany();
    console.log('✅ Conexões apagadas.');

    await prisma.entity.deleteMany();
    console.log('✅ Entidades (Titulares) apagadas.');

    console.log('\n🎉 Todos os dados foram apagados com sucesso!');
    console.log('Você pode rodar seu script de sincronização novamente para puxar tudo do zero.');
  } catch (error) {
    console.error('❌ Erro ao limpar os dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();

from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import simpleSplit
from pathlib import Path
import pypdfium2 as fitz
out=Path("output/pdf/REJET-CORP_guia_apresentacao.pdf")
pages=[
("O projeto e a equipe",[
("Abertura sugerida","Nosso projeto se chama REJET-CORP. Desenvolvemos uma plataforma web para facilitar a logística reversa de materiais entre indústrias, conectando empresas que possuem materiais disponíveis com organizações interessadas em comprá-los ou recebê-los por doação."),
("Identificação","Título: Desenvolvimento de uma plataforma web para a Logística Reversa de materiais entre indústrias.\nInstituição: Etec Rodrigues de Abreu.\nCurso: Técnico em Informática para Internet.\nOrientadora: Ana Paula Zaniboni Barreto."),
("Autores","Caio Eduardo Miranda Ferrari; Eduardo Ataíde; Guilherme Silva Lacerda; Leonardo Tozato; Maria Eduarda Silva de Souza."),
("Problema e objetivo","Empresas podem ter dificuldade para encontrar interessados em materiais que deixaram de utilizar. O REJET-CORP centraliza anúncios e comunicação para facilitar oportunidades de reaproveitamento e incentivar a economia circular."),
("Conceitos para lembrar","Logística reversa: retorno de materiais ao ciclo produtivo ou a uma destinação adequada.\nEconomia circular: manutenção de materiais em uso por meio do reaproveitamento.\nB2B: relação comercial entre empresas.")]),
("Como apresentar o funcionamento",[
("Fluxo principal","1. A empresa cria uma conta e acessa a plataforma.\n2. Preenche seu perfil e publica um anúncio.\n3. Outra empresa pesquisa materiais e consulta os detalhes.\n4. Demonstra interesse e conversa com a anunciante.\n5. As partes acompanham a negociação e combinam retirada ou entrega."),
("Acesso e empresas","Cadastro, login, recuperação de senha, perfil empresarial, contato, endereço e localização."),
("Anúncios e marketplace","Cadastro, edição e exclusão de anúncios; pesquisa e filtros; detalhes; favoritos; imagens e documentos. O anúncio reúne categoria, descrição, condição, quantidade, unidade, peso, localização, preço, indicação de doação e possibilidade de negociação."),
("Negociação e comunicação","Registro de interesse, status e histórico da negociação; conversas entre empresas; mensagens; notificações; avaliações por notas e comentários."),
("Gestão","Painel com indicadores, relatórios e registros de atividades. Área administrativa para empresas, anúncios e denúncias. Configurações de tema, notificações e privacidade."),
("Durante a demonstração","Apresentem o caminho do anúncio até a negociação. Confirmem previamente quais fluxos estão validados no ambiente que será usado pela equipe.")]),
("Tecnologias e arquitetura",[
("Frontend","React 19: telas e componentes interativos.\nTypeScript: tipagem e identificação de inconsistências no desenvolvimento.\nHTML e CSS, incluindo CSS Modules: estrutura e estilos.\nVite 8: execução local e geração da versão de produção."),
("Bibliotecas","React Router 7: navegação entre páginas.\nReact Hook Form e Zod: formulários e validação.\nReact Icons: ícones.\nReact Hot Toast: mensagens de retorno ao usuário."),
("Backend e integrações","Supabase: serviços de backend utilizados pela aplicação.\nPostgreSQL: banco relacional.\nSupabase Auth: contas e sessões.\nSupabase Storage: arquivos.\nSupabase Realtime: atualizações de mensagens e notificações.\nViaCEP: consulta de endereço pelo CEP."),
("Organização do código","Páginas representam as telas; componentes são elementos reutilizáveis; serviços concentram o acesso aos dados; hooks reutilizam lógica; contextos compartilham sessão e notificações; tipos descrevem os dados. As rotas privadas controlam a entrada nas áreas autenticadas."),
("Ferramentas de desenvolvimento","npm gerencia dependências e comandos. TypeScript verifica tipos na compilação. Oxlint analisa o código. O frontend se comunica com os serviços do Supabase pela biblioteca JavaScript."),
("Fala curta","Utilizamos React e TypeScript na interface e Supabase no backend, com PostgreSQL para armazenar dados relacionados entre empresas, anúncios, conversas e negociações.")]),
("Banco de dados e segurança",[
("Estrutura criada","14 tabelas no esquema public, com relacionamentos, índices e políticas de acesso. Dez categorias iniciais, nove gatilhos e um bucket chamado produtos. Realtime habilitado para messages e notifications."),
("Tabelas de empresas e anúncios","companies: perfis empresariais.\ncategories e subcategories: classificação de materiais.\nprodutos: anúncios de venda ou doação.\nfavorites: anúncios salvos pelos usuários."),
("Tabelas de interação","conversations e messages: conversas e mensagens.\nnegotiations: negociações.\nnegotiation_history: histórico de mudanças.\nnotifications: avisos.\nreviews: avaliações."),
("Tabelas de gestão","reports: denúncias.\nactivity_logs: registros de atividades.\nuser_settings: preferências.\nAs contas de acesso ficam no Supabase Auth; o perfil empresarial fica em companies."),
("Segurança","RLS habilitada nas 14 tabelas: políticas controlam o acesso às linhas conforme o usuário. Há proteção para campos administrativos do perfil e restrição de gravação de arquivos à pasta do usuário autenticado. A configuração local usa variáveis de ambiente excluídas do versionamento."),
("Como explicar os gatilhos","Gatilhos são rotinas executadas pelo banco em resposta a eventos. No projeto, apoiam notificações, registros de atividade, histórico de negociações e proteção de campos administrativos.")]),
("Perguntas da banca e encerramento",[
("Qual é o diferencial?","Reunir anúncios de materiais industriais, opções de venda ou doação e comunicação entre empresas em um mesmo ambiente voltado ao reaproveitamento."),
("Por que usar PostgreSQL?","Os dados possuem relações claras. Uma empresa publica anúncios, participa de conversas e negociações e recebe avaliações. O modelo relacional permite representar esses vínculos e aplicar integridade aos dados."),
("Qual é a função do Supabase?","Fornecer banco PostgreSQL, autenticação, armazenamento de arquivos e recursos de atualização em tempo real utilizados pela aplicação."),
("Como ocorre o cadastro?","O Supabase Auth cria a conta de acesso. O sistema utiliza o identificador da conta para gravar o perfil da empresa em companies. A confirmação por e-mail e o login precisam ser verificados juntos no teste completo."),
("Situação verificada em 17/11/2026","Esquema criado e conferido no novo Supabase; frontend local configurado; endpoint de autenticação acessível e cadastro por e-mail habilitado; compilação aprovada. Lint sem erros, com oito avisos. Permanecem pendentes os testes completos de cadastro com confirmação de e-mail, demais fluxos e deploy. A auditoria completa segue em andamento."),
("Encerramento sugerido","Com o REJET-CORP, buscamos aproximar indústrias e facilitar o reaproveitamento de materiais por meio de uma plataforma que reúne anúncios, comunicação e acompanhamento de negociações, contribuindo para práticas de economia circular."),
("Divisão sugerida entre os cinco integrantes","1. Contexto e objetivo. 2. Funcionalidades e demonstração. 3. Tecnologias e arquitetura. 4. Banco e segurança. 5. Resultados, limitações e encerramento. A equipe pode adaptar a divisão ao tempo disponível.")])]
c=canvas.Canvas(str(out),pagesize=(595.28,841.89))
c.setTitle("REJET-CORP | Guia de apoio à apresentação")
for i,(title,sections) in enumerate(pages,1):
 c.setFillColor(HexColor("#124c3f")); c.rect(0,754,596,88,fill=1,stroke=0)
 c.setFillColor(HexColor("#ffffff"));c.setFont("Helvetica-Bold",12);c.drawString(40,810,"REJET-CORP")
 c.setFont("Helvetica",10);c.drawString(40,789,"GUIA DE APOIO À APRESENTAÇÃO")
 c.setFont("Helvetica-Bold",19);c.drawString(40,763,title)
 y=728
 for heading,body in sections:
  c.setFillColor(HexColor("#124c3f"));c.setFont("Helvetica-Bold",11);c.drawString(40,y,heading);y-=18
  c.setFillColor(HexColor("#26332f"));c.setFont("Helvetica",10.5)
  for paragraph in body.split("\n"):
   for line in simpleSplit(paragraph,"Helvetica",10.5,515):
    c.drawString(40,y,line);y-=14
  y-=14
 assert y>45,(i,y)
 c.setStrokeColor(HexColor("#d5dfda"));c.line(40,39,555,39)
 c.setFont("Helvetica",9);c.setFillColor(HexColor("#64756d"));c.drawString(40,24,"Etec Rodrigues de Abreu | Informática para Internet");c.drawRightString(555,24,f"{i} / {len(pages)}")
 c.showPage()
c.save()
d=fitz.PdfDocument(str(out))
for i,p in enumerate(d):
 p.render(scale=.8).to_pil().save(f"tmp/pdfs/pagina-{i+1}.png")
print(f"{len(d)} páginas | {out.resolve()}")


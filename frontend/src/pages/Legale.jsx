import { Link } from 'react-router-dom';
import { useI18n } from '../i18n.jsx';

const LEGAL = {
  mentions: {
    fr: [
      ['Éditeur', "AN Connect Tchad est le portail numérique officiel de l'Assemblée Nationale de la République du Tchad, sise au Palais de la Démocratie, N'Djamena."],
      ['Directeur de la publication', "Le Secrétariat général de l'Assemblée Nationale."],
      ['Hébergement', 'La plateforme est hébergée sur une infrastructure sécurisée. Les journaux techniques sont conservés conformément à la réglementation en vigueur.'],
      ['Propriété intellectuelle', "Les textes officiels sont librement réutilisables avec mention de la source. L'emblème de l'Assemblée ne peut être réutilisé sans autorisation."],
    ],
    ar: [
      ['الناشر', 'AN Connect Tchad هي البوابة الرقمية الرسمية للجمعية الوطنية لجمهورية تشاد، ومقرها قصر الديمقراطية، انجمينا.'],
      ['مدير النشر', 'الأمانة العامة للجمعية الوطنية.'],
      ['الاستضافة', 'تُستضاف المنصة على بنية تحتية آمنة، وتُحفظ السجلات التقنية وفقًا للأنظمة المعمول بها.'],
      ['الملكية الفكرية', 'النصوص الرسمية قابلة لإعادة الاستخدام بحرية مع ذكر المصدر. لا يجوز استخدام شعار الجمعية دون إذن.'],
    ],
  },
  confidentialite: {
    fr: [
      ['Données collectées', 'Le portail public est consultable sans compte. Les formulaires citoyens ne collectent que les informations que vous saisissez : nom, contact, province et message.'],
      ['Finalité', 'Ces données servent uniquement au traitement de votre demande et ne sont jamais cédées à des tiers.'],
      ['Comptes parlementaires', 'Les connexions sont journalisées (date, IP) à des fins de sécurité. Les mots de passe sont hachés et la double authentification est proposée.'],
      ['Vos droits', "Vous pouvez demander la consultation, la rectification ou la suppression de vos données via l'espace citoyen."],
    ],
    ar: [
      ['البيانات المجمعة', 'يمكن تصفح البوابة العمومية دون حساب. لا تجمع الاستمارات المواطنية سوى المعلومات التي تدخلونها: الاسم ووسيلة الاتصال والإقليم والرسالة.'],
      ['الغرض', 'تُستخدم هذه البيانات فقط لمعالجة طلبكم ولا تُحال أبدًا إلى أطراف ثالثة.'],
      ['الحسابات البرلمانية', 'تُسجَّل عمليات الدخول (التاريخ وIP) لأغراض أمنية. تُحفظ كلمات المرور مشفَّرة، والمصادقة الثنائية متاحة.'],
      ['حقوقكم', 'يمكنكم طلب الاطلاع على بياناتكم أو تصحيحها أو حذفها عبر فضاء المواطن.'],
    ],
  },
};

export default function Legale({ which }) {
  const { t, lang } = useI18n();
  const titre = t(which === 'mentions' ? 'legal.mentions' : 'legal.confidentialite');
  const sections = LEGAL[which][lang] || LEGAL[which].fr;
  return (
    <main className="container" style={{ paddingBlock: 'var(--space-10) var(--space-16)' }}>
      <div className="breadcrumb" style={{ marginBlockEnd: 'var(--space-6)' }}>
        <Link to="/">{t('nav.accueil')}</Link> <span className="breadcrumb__sep">/</span> <span>{titre}</span>
      </div>
      <h1 className="section-title" style={{ marginBlockEnd: 'var(--space-8)' }}>{titre}</h1>
      <div className="legal-content">
        {sections.map(([h, p], i) => <div key={i}><h2>{h}</h2><p>{p}</p></div>)}
      </div>
    </main>
  );
}

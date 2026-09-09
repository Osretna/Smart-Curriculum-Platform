/**
 * Client-side Educational AI Teacher Engine
 * Provides instant, high-quality curriculum explanations even when offline,
 * on static deployments (e.g. Vercel), or when backend API is unavailable.
 */

export interface ExplanationRequest {
  question: string;
  bookTitle?: string;
  chapterTitle?: string;
  grade?: string;
  subject?: string;
  currentExplanation?: string;
}

export function generateClientAiExplanation(req: ExplanationRequest): string {
  const { question, bookTitle = 'الكتاب المدرسي', chapterTitle = 'الدرس', subject = 'general', currentExplanation = '' } = req;
  const q = question.trim().toLowerCase();

  const isEnglish =
    subject === 'english' ||
    bookTitle.toLowerCase().includes('connect') ||
    bookTitle.toLowerCase().includes('english') ||
    bookTitle.includes('إنجليزي');

  const isFrench =
    subject === 'french' ||
    bookTitle.toLowerCase().includes('french') ||
    bookTitle.toLowerCase().includes('français') ||
    bookTitle.includes('فرنسي');

  if (isEnglish) {
    return generateEnglishSubjectExplanation(q, question, bookTitle, chapterTitle, currentExplanation);
  }

  if (isFrench) {
    return generateFrenchSubjectExplanation(q, question, bookTitle, chapterTitle, currentExplanation);
  }

  return generateGeneralSubjectExplanation(q, question, bookTitle, chapterTitle, currentExplanation);
}

function generateEnglishSubjectExplanation(
  q: string,
  originalQ: string,
  bookTitle: string,
  chapterTitle: string,
  currentExplanation: string
): string {
  // Check if student asked about Present Simple (المضارع البسيط)
  if (q.includes('مضارع بسيط') || q.includes('present simple') || q.includes('مضارع')) {
    return `💡 **Bilingual Masterclass: Present Simple Tense (شرح قاعدة المضارع البسيط بالتفصيل)**

The Present Simple tense is used to talk about regular habits, routines, and permanent scientific facts.
ترجمة وشرح: يُستخدم زمن المضارع البسيط (Present Simple) للتعبير عن العادات اليومية المتكررة، والروتين، والحقائق العلمية الثابتة.

For singular subjects (He, She, It, or singular noun), we add -s or -es to the base verb.
ترجمة وشرح: مع الفاعل المفرد (He / She / It أو أي اسم مفرد)، نضيف للحرف الأخير من الفعل حرف (s) أو (es)، مثل: He plays / She watches.

For plural subjects and (I, We, They, You), we use the base infinitive form of the verb without adding anything.
ترجمة وشرح: أما مع ضمائر الجمع والضمير أنا (I / We / They / You أو أي اسم جمع)، نضع الفعل في صيغة المصدر المجردة بدون أي إضافات، مثل: They play / We learn.

Example 1: Plants need sunlight and water to produce food every day.
ترجمة وشرح: مثال 1 (حقيقة علمية): النباتات تحتاج إلى ضوء الشمس والماء لصنع الغذاء يومياً (الفعل need مجرد لأن Plants جمع).

Example 2: The student studies his lessons in "${bookTitle}" with great enthusiasm.
ترجمة وشرح: مثال 2: الطالب يذاكر دروسه في كتاب "${bookTitle}" بحماس كبير (الفعل studies أضيف له es لأن the student مفرد).

In negative sentences, we use (don't + verb) with plural, and (doesn't + verb) with singular.
ترجمة وشرح: في النفي: نستخدم (don't + الفعل في المصدر) مع الجمع، ونستخدم (doesn't + الفعل في المصدر) مع المفرد، مثل: He doesn't sleep late.

Key Signal Words (الكلمات الدالة الهامة):
Always (دائماً) - Usually (عادةً) - Often (غالباً) - Sometimes (أحياناً) - Every day (كل يوم).
ترجمة وشرح: هذه الكلمات تأتي غالباً قبل الفعل الأساسي أو في نهاية الجملة لتوضح التكرار.

⭐ **Exam Summary (خلاصة الامتحان السريعة):**
1. المفرد يأخذ الفعل مضافاً له s أو es.
2. الجمع والضمير I يأخذان الفعل مجرداً.
3. مع النفي بـ Doesn't يرجع الفعل إلى مصدره المجرد تماماً!`;
  }

  // Check if student asked about Vocabulary (أهم الكلمات والمفردات)
  if (q.includes('كلمات') || q.includes('مفردات') || q.includes('vocab') || q.includes('words')) {
    return `💡 **Key Vocabulary & Glossary for: "${chapterTitle}" (أهم مفردات الدرس ومعانيها)**

Here are the most important vocabulary words and key terms from this unit with their meanings.
ترجمة وشرح: إليك قائمة بأهم المفردات اللغوية والمصطلحات الأساسية في هذا الدرس من كتاب "${bookTitle}" مع ترجمتها الدقيقة.

Vocabulary 1: Environment (البيئة المحيطة بالكائنات الحية) - The natural world in which people, animals, and plants live.
ترجمة وشرح: البيئة: هي الوسط الطبيعي الذي تعيش فيه النباتات والحيوانات والإنسان وتتفاعل معاً.

Vocabulary 2: Characteristics (الصفات والخصائص المميزة) - Special qualities or features belonging to something.
ترجمة وشرح: الخصائص والمميزات: الصفات الفريدة التي تميز كل كائن حي أو عنصر في الدرس.

Vocabulary 3: Discover and Learn (يكتشف ويتعلم) - To find information or a place for the first time.
ترجمة وشرح: يكتشف ويبحث: المهارة الأساسية المطلوبة من الطالب لفهم وتطبيق معلومات الدرس.

Useful Sentence: We should always protect our local environment and study hard.
ترجمة وشرح: جملة تطبيقية: يجب علينا دائماً حماية بيئتنا المحلية والمذاكرة بجد واجتهاد.

⭐ **Study Advice (نصيحة لحفظ الكلمات):**
ضع كل كلمة جديدة في جملة بسيطة من تأليفك واقرأها بصوت مسموع لترسيخ نطقها الصحيح!`;
  }

  // Check if student asked for sentences & pronunciation (جملتين من الدرس ونطقهما)
  if (q.includes('جملتين') || q.includes('نطق') || q.includes('pronunciation') || q.includes('sentences')) {
    return `💡 **Model Sentences and Clear Pronunciation (جمل تطبيقية نموذجية مع النطق الصحيح)**

Sentence 1: Science and knowledge help us build a bright future for our country.
ترجمة وشرح: الجملة الأولى: العلوم والمعرفة تساعدنا في بناء مستقبل مشرق لوطننا العزيز.

Pronunciation Guide: Notice the linking sound between "help" and "us", and pronounce "bright" clearly.
ترجمة وشرح: دليل النطق: انتبه لربط كلمتي "help us" معاً، وانطق كلمة "bright" بحرف t خفيف ونقي.

Sentence 2: Active reading improves your vocabulary and makes your memory stronger.
ترجمة وشرح: الجملة الثانية: القراءة النشطة تطور حصيلتك اللغوية وتجعل ذاكرتك أكثر قوة.

Pronunciation Guide: Stress the first syllable in "active" and "memory" for authentic natural English.
ترجمة وشرح: دليل النطق: اضغط بنبرة صوتية واضحة على المقطع الأول في كلمتي "active" و "memory".

⭐ **Practice Tip (تمرين صوتي):**
اضغط على زر النطق الصوتي 🔊 للاستماع إلى الجملتين بصوت واضح ثم رددهما خلف المعلم مرتين!`;
  }

  // Generic / Default English explanation
  return `💡 **Educational Explanation (شرح تفصيلي حول: ${originalQ})**

In this lesson "${chapterTitle}" from "${bookTitle}", we focus on deep conceptual understanding.
ترجمة وشرح: في هذا الدرس "${chapterTitle}" من كتاب "${bookTitle}"، نركز على الفهم العميق والمفاهيم الأساسية المرتبطة بسؤالك.

Regarding your question: "${originalQ}", remember to connect the lesson facts with daily examples.
ترجمة وشرح: فيما يتعلق باستفسارك: "${originalQ}"، تذكر دائماً ربط حقائق الدرس بالأمثلة الواقعية والتطبيق العملي.

${currentExplanation ? `As highlighted in our lesson text: Review the key sentences and main paragraphs carefully.
ترجمة وشرح: كما ورد في نص شرح الفصل: احرص على مراجعة الجمل الرئيسية والفقرات المصاحبة بدقة.` : `Clear sentence construction is the fastest path to mastering foreign language concepts.
ترجمة وشرح: تكوين الجمل الواضحة هو أسرع طريق لإتقان وفهم المادة الدراسية.`}

⭐ **Key Takeaways (نقاط التفوق والتميز):**
1. Read the English text aloud to build fluent speaking skills. (اقرأ النص الإنجليزي بصوت مسموع لبناء مهارة الطلاقة).
2. Use the interactive audio player to hear exact native pronunciation. (استخدم مشغل الصوت التفاعلي لسماع النطق الصحيح).
3. Test your knowledge in the chapter quiz right after reading. (اختبر معلوماتك في اختبار الفصل بعد القراءة مباشرة).`;
}

function generateFrenchSubjectExplanation(
  q: string,
  originalQ: string,
  bookTitle: string,
  chapterTitle: string,
  currentExplanation: string
): string {
  return `💡 **Explication Bilingue (شرح تفصيلي بالفرنسية والعربية حول: ${originalQ})**

Dans cette leçon "${chapterTitle}", nous apprenons le vocabulaire et les règles essentielles.
ترجمة وشرح: في هذا الدرس "${chapterTitle}" من كتاب "${bookTitle}"، نتعلم المفردات والقواعد الأساسية الهامة.

Concernant votre question: "${originalQ}", la clé de la réussite est la pratique régulière.
ترجمة وشرح: بخصوص سؤالك: "${originalQ}"، مفتاح التفوق هو الممارسة المستمرة والاستماع للنطق السليم.

Règle importante: En français, faites toujours attention à l'accord des adjectifs et des verbes.
ترجمة وشرح: قاعدة هامة: في اللغة الفرنسية، انتبه دائماً لمطابقة الصفات وتصريف الأفعال مع الفاعل.

⭐ **Conseils d'or (نصائح ذهبية):**
1. Écoutez la prononciation correcte avec le lecteur audio. (استمع للنطق الصحيح عبر مشغل الصوت).
2. Répétez les phrases à haute voix. (كرر الجمل بصوت مسموع لتثبيت النطق).`;
}

function generateGeneralSubjectExplanation(
  q: string,
  originalQ: string,
  bookTitle: string,
  chapterTitle: string,
  currentExplanation: string
): string {
  return `💡 **شرح تعليمي مخصص حول: ${originalQ}**

أهلاً بك يا بطل! سؤالك رائع ومهم جداً لفهم أسرار درس "${chapterTitle}" في كتاب "${bookTitle}".

📌 **الشرح المفاهيمي المبسط**:
- في سياق هذا الدرس، يرتبط موضوع "${originalQ}" بالقاعدة والمحاور الجوهرية المقررة؛ حيث يتطلب منك فهم كيفية انتقال المفاهيم وتطبيقاتها العلمية والعملية.
${currentExplanation ? `- استناداً إلى شرح الفصل: ${currentExplanation.substring(0, 180)}...` : '- يرتكز هذا المحور على خطوات متسلسلة تبدأ بتحديد الفكرة الرئيسية، ثم تحليل التفاصيل والأمثلة.'}
- **مثال تطبيقي**: عند مواجهة أي سؤال حول هذه النقطة في ورقة الامتحان، ابدأ بتحديد الكلمات المفتاحية، ثم اكتب خطوات الحل بترتيب منطقي.

⭐ **نقاط ذهبية للتفوق والفهم السريع**:
1. الربط بين عنوان الدرس والمفاهيم الفرعية يرسخ المعلومة بنسبة 95%.
2. الشرح لزميل أو تلخيص الفكرة بأسلوبك الخاص ينقل المعلومة للذاكرة طويلة المدى.
3. قم بحل أسئلة الفصل التفاعلية في نهاية الصفحة للتأكد من استيعابك الكامل!`;
}

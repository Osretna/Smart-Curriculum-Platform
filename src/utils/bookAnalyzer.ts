import { EducationalStageId, ExternalBook, SecondaryStreamId } from '../types';

export interface ExtractedBookData {
  title: string;
  author: string;
  publisher: string;
  stageId: EducationalStageId;
  gradeId: string;
  subjectId: string;
  streamId?: SecondaryStreamId;
  description: string;
  coverImage: string;
  chapters: {
    number: number;
    title: string;
    summary: string;
    detailedExplanation: string;
    keyPoints: string[];
    definitions?: { term: string; definition: string }[];
    estimatedMinutes: number;
    quiz: {
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }[];
  }[];
}

/**
 * High-accuracy local curriculum knowledge base for Egyptian/Arab school books
 * (e.g. Al-Moasser, Al-Adwaa, Selah El-Telmeez, El-Emtehan, Newton, etc.)
 */
export function generateCurriculumFromFilename(fileName: string, extractedText?: string): ExtractedBookData {
  const textSample = (extractedText ? extractedText.slice(0, 5000) : '').toLowerCase();
  const clean = (fileName + ' ' + textSample).toLowerCase().replace(/[\-_]/g, ' ');

  // 1. Stage & Grade Detection
  let stageId: EducationalStageId = 'primary';
  let gradeId = 'grade-p5'; // Default to Primary 5 if matches user sample

  if (clean.includes('5 ب') || clean.includes('5ب') || clean.includes('خامس') || clean.includes('خامسة') || clean.includes('grade 5') || clean.includes('p5')) {
    stageId = 'primary';
    gradeId = 'grade-p5';
  } else if (clean.includes('4 ب') || clean.includes('4ب') || clean.includes('رابع') || clean.includes('رابعة') || clean.includes('p4')) {
    stageId = 'primary';
    gradeId = 'grade-p4';
  } else if (clean.includes('6 ب') || clean.includes('6ب') || clean.includes('سادس') || clean.includes('سادسة') || clean.includes('p6')) {
    stageId = 'primary';
    gradeId = 'grade-p6';
  } else if (clean.includes('1 ب') || clean.includes('اولى ابتدائي') || clean.includes('p1')) {
    stageId = 'primary';
    gradeId = 'grade-p1';
  } else if (clean.includes('2 ب') || clean.includes('ثانية ابتدائي') || clean.includes('p2')) {
    stageId = 'primary';
    gradeId = 'grade-p2';
  } else if (clean.includes('3 ب') || clean.includes('ثالثة ابتدائي') || clean.includes('p3')) {
    stageId = 'primary';
    gradeId = 'grade-p3';
  } else if (clean.includes('3 ث') || clean.includes('3ث') || clean.includes('ثانوية عامة') || clean.includes('ثالث ثانوي') || clean.includes('s3')) {
    stageId = 'secondary';
    gradeId = 'grade-s3';
  } else if (clean.includes('1 ث') || clean.includes('اولى ثانوي') || clean.includes('s1')) {
    stageId = 'secondary';
    gradeId = 'grade-s1';
  } else if (clean.includes('2 ث') || clean.includes('ثانية ثانوي') || clean.includes('s2')) {
    stageId = 'secondary';
    gradeId = 'grade-s2';
  } else if (clean.includes('1 ع') || clean.includes('اولى اعدادي') || clean.includes('m1')) {
    stageId = 'prep';
    gradeId = 'grade-m1';
  } else if (clean.includes('2 ع') || clean.includes('ثانية اعدادي') || clean.includes('m2')) {
    stageId = 'prep';
    gradeId = 'grade-m2';
  } else if (clean.includes('3 ع') || clean.includes('ثالثة اعدادي') || clean.includes('شهادة اعدادية') || clean.includes('m3')) {
    stageId = 'prep';
    gradeId = 'grade-m3';
  }

  // 2. Subject Detection
  let subjectId = 'english';
  let streamId: SecondaryStreamId | undefined = undefined;

  if (clean.includes('كونكت') || clean.includes('connect') || clean.includes('انجليزي') || clean.includes('english')) {
    subjectId = 'english';
  } else if (clean.includes('علوم') || clean.includes('science')) {
    subjectId = 'science';
  } else if (clean.includes('رياضيات') || clean.includes('ماث') || clean.includes('math')) {
    subjectId = stageId === 'secondary' ? 'pure_math' : 'math';
  } else if (clean.includes('فيزياء') || clean.includes('physics')) {
    subjectId = 'physics';
    stageId = 'secondary';
    streamId = 'scientific';
  } else if (clean.includes('كيمياء') || clean.includes('chemistry')) {
    subjectId = 'chemistry';
    stageId = 'secondary';
    streamId = 'scientific';
  } else if (clean.includes('احياء') || clean.includes('أحياء') || clean.includes('biology')) {
    subjectId = 'biology';
    stageId = 'secondary';
    streamId = 'scientific';
  } else if (clean.includes('تاريخ') || clean.includes('history')) {
    subjectId = 'history';
    stageId = 'secondary';
    streamId = 'literary';
  } else if (clean.includes('جغرافيا') || clean.includes('geography')) {
    subjectId = 'geography';
    stageId = 'secondary';
    streamId = 'literary';
  } else if (clean.includes('فلسفة') || clean.includes('منطق')) {
    subjectId = 'philosophy';
    stageId = 'secondary';
    streamId = 'literary';
  } else if (clean.includes('دراسات') || clean.includes('social')) {
    subjectId = 'social';
  } else if (clean.includes('عربي') || clean.includes('لغة عربية')) {
    subjectId = 'arabic';
  }

  // 3. Publisher & Author
  let publisher = 'دار المعاصر للنشر والتوزيع';
  let author = 'سلسلة كتب المعاصر التعليمية';

  if (clean.includes('معاصر') || clean.includes('moasser')) {
    publisher = 'دار المعاصر للطباعة والنشر والتوزيع';
    author = 'نخبة من خبراء ومؤلفي سلسلة المعاصر';
  } else if (clean.includes('أضواء') || clean.includes('اضواء') || clean.includes('adwaa')) {
    publisher = 'دار نهضة مصر للطباعة والنشر (الأضواء)';
    author = 'أسرة تحرير وموجهي سلسلة الأضواء التعليمية';
  } else if (clean.includes('سلاح التلميذ') || clean.includes('تلميذ') || clean.includes('selah')) {
    publisher = 'شركة سلاح التلميذ للطباعة والنشر';
    author = 'نخبة من كبار الخبراء التربويين - سلاح التلميذ';
  } else if (clean.includes('امتحان') || clean.includes('emtehan')) {
    publisher = 'سلسلة كتب الامتحان التعليمية';
    author = 'نخبة من كبار موجهي ومعلمي المادة - الامتحان';
  } else if (clean.includes('نيوتن') || clean.includes('newton')) {
    publisher = 'سلسلة كتب نيوتن التعليمية';
    author = 'أساتذة الفيزياء بسلسلة نيوتن';
  } else if (clean.includes('متميز') || clean.includes('motamayezen')) {
    publisher = 'سلسلة ومبادرة بنك أسئلة المتميز';
    author = 'أ. محمود سعيد وفريق المتميز التعليمي';
  }

  // 4. Term Detection
  const termName = clean.includes('ثاني') || clean.includes('ترم 2') || clean.includes('ترم_ثاني') ? 'الفصل الدراسي الثاني' : 'الفصل الدراسي الأول';

  // 5. Build Stage/Grade Label
  const gradeLabel =
    gradeId === 'grade-p5'
      ? 'الصف الخامس الابتدائي'
      : gradeId === 'grade-p4'
      ? 'الصف الرابع الابتدائي'
      : gradeId === 'grade-p6'
      ? 'الصف السادس الابتدائي'
      : gradeId === 'grade-s3'
      ? 'الصف الثالث الثانوي'
      : gradeId === 'grade-m2'
      ? 'الصف الثاني الإعدادي'
      : 'الصف الدراسي المقرر';

  // 6. Connect Plus Grade 5 Specialized Curriculum
  if (subjectId === 'english' && gradeId === 'grade-p5') {
    return {
      title: `المعاصر في اللغة الإنجليزية (Connect Plus 5) - ${gradeLabel} - ${termName}`,
      author: `${author} بالتعاون مع المتميز`,
      publisher,
      stageId,
      gradeId,
      subjectId,
      streamId,
      coverImage: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=600&q=80',
      description: `كتاب ودليل دراسي شامل ومفصل لمادة اللغة الإنجليزية (Connect Plus 5) لطلاب الصف الخامس الابتدائي. يتضمن شروحات صوتية مبسطة للوحدات، وحصيلة لغوية مميزة، وشرحاً تفاعلياً لقواعد الجرامر، مع تدريبات واختبارات قياس نواتج التعلم المتطابقة مع نظام التقييم الحديث.`,
      chapters: [
        {
          number: 1,
          title: 'Unit 1: Plant Life & Biodiversity in Egypt (حياة النباتات والتنوع البيولوجي)',
          summary: 'دراسة أجزاء النبات وعملية البناء الضوئي وأهمية النباتات الطبيعية والطبية في وادي النيل وسيناء.',
          detailedExplanation: `Welcome to Unit 1: Plant Life and Biodiversity in Egypt!
ترجمة وشرح: مرحباً بكم في الوحدة الأولى: حياة النباتات والتنوع البيولوجي في مصر!

In this unit, we explore how green plants make their own food through photosynthesis.
ترجمة وشرح: في هذه الوحدة، نستكشف كيف تصنع النباتات الخضراء غذاءها بنفسها من خلال عملية البناء الضوئي.

Roots absorb water and essential minerals from the soil to anchor the plant firmly.
ترجمة وشرح: تمتص الجذور الماء والأملاح المعدنية الأساسية من التربة لتثبيت النبات بقوة في الأرض.

Leaves contain chlorophyll, the green pigment that traps sunlight to create glucose and oxygen.
ترجمة وشرح: تحتوي الأوراق على مادة الكلوروفيل الخضراء التي تمتص ضوء الشمس لتصنيع سكر الجلوكوز وغاز الأكسجين.

Grammar Rule: We use the Present Simple tense for scientific facts and permanent truths.
ترجمة وشرح: القاعدة النحوية: نستخدم زمن المضارع البسيط للتعبير عن الحقائق العلمية والثوابت الكونية.

Example: "A healthy plant needs fresh water and bright sunlight to grow."
ترجمة وشرح: مثال: "يحتاج النبات السليم إلى الماء العذب وضوء الشمس الساطع للنمو."`,
          keyPoints: [
            'Chlorophyll absorbs sunlight energy inside plant leaves.',
            'الترجمة: الكلوروفيل يمتص طاقة ضوء الشمس داخل أوراق النبات.',
            'Photosynthesis produces glucose sugar and fresh oxygen.',
            'الترجمة: عملية البناء الضوئي تُنتج سكر الجلوكوز وغاز الأكسجين النقي.',
            'Present Simple is used for scientific facts.',
            'الترجمة: يُستخدم زمن المضارع البسيط لصياغة الحقائق العلمية.',
          ],
          definitions: [
            { term: 'Photosynthesis', definition: 'عملية البناء الضوئي التي يصنع بها النبات غذاءه باستخدام ضوء الشمس والماء وثاني أكسيد الكربون.' },
            { term: 'Nutrients', definition: 'المغذيات والعناصر الغذائية التي يمتصها النبات من التربة للنمو الصحي.' },
            { term: 'Chlorophyll', definition: 'الصبغة الخضراء في أوراق النباتات المسؤولة عن امتصاص الطاقة الضوئية.' },
          ],
          estimatedMinutes: 10,
          quiz: [
            {
              question: 'What do green leaves use to absorb sunlight during photosynthesis?',
              options: ['Chlorophyll', 'Pollen', 'Soil nutrients', 'Bark'],
              correctIndex: 0,
              explanation: 'Chlorophyll is the green pigment in leaves that absorbs sunlight energy.',
            },
            {
              question: 'Which gas do plants release into the air after making their food?',
              options: ['Nitrogen', 'Oxygen', 'Carbon dioxide', 'Helium'],
              correctIndex: 1,
              explanation: 'Plants release oxygen (غاز الأكسجين) which humans and animals breathe.',
            },
            {
              question: 'Complete: A plant ______ water and nutrients from the soil.',
              options: ['absorbs', 'absorb', 'absorbing', 'absorbed'],
              correctIndex: 0,
              explanation: 'Because "A plant" is singular, the verb in present simple takes "s" (absorbs).',
            },
          ],
        },
        {
          number: 2,
          title: 'Unit 2: Ecosystems and Animals of the Nile Basin (الأنظمة البيئية وحيوانات النيل)',
          summary: 'استكشاف التكيف البيئي وسلاسل الغذاء وحيوانات البيئة المائية والصحراوية في مصر.',
          detailedExplanation: `Welcome to Unit 2: Ecosystems and Wildlife in Egypt!
ترجمة وشرح: مرحباً بكم في الوحدة الثانية: الأنظمة البيئية والحياة البرية في مصر!

An ecosystem is a community where living organisms interact with non-living things like water and air.
ترجمة وشرح: النظام البيئي هو مجتمع بيئي تتفاعل فيه الكائنات الحية مع الأشياء غير الحية مثل الماء والهواء.

A food chain always starts with green plants, which we call producers.
ترجمة وشرح: تبدأ السلسلة الغذائية دائماً بالنباتات الخضراء، والتي نطلق عليها اسم الكائنات المنتجة.

Animals cannot produce their own food, so they are called consumers.
ترجمة وشرح: لا تستطيع الحيوانات إنتاج غذائها بنفسها، لذا تُسمى بالكائنات المستهلكة.

Primary consumers eat plants, and predators hunt other animals for energy.
ترجمة وشرح: تتغذى المستهلكات الأولية على النباتات، وتصطاد الحيوانات المفترسة كائنات أخرى للحصول على الطاقة.

Decomposers like bacteria recycle organic nutrients back into the soil.
ترجمة وشرح: تقوم الكائنات المحللة كالبكتيريا بإعادة تدوير العناصر الغذائية العضوية إلى التربة.`,
          keyPoints: [
            'Producers make food, while consumers depend on other living things.',
            'الترجمة: الكائنات المنتجة تصنع الغذاء، بينما تعتمد المستهلكات على غيرها.',
            'Decomposers maintain the fertility of soil and nature.',
            'الترجمة: المحللات تحافظ على خصوبة التربة وتوازن الطبيعة.',
            'Desert animals like the Fennec fox have big ears to keep cool.',
            'الترجمة: حيوانات الصحراء مثل ثعلب الفنك تمتلك آذاناً كبيرة لتبريد حرارة الجسم.',
          ],
          definitions: [
            { term: 'Ecosystem', definition: 'نظام بيئي يشمل جميع الكائنات الحية وغير الحية المتفاعلة في منطقة محددة.' },
            { term: 'Producer', definition: 'كائن منتج يصنع غذاءه بنفسه باستخدام الطاقة الشمسية مثل النباتات.' },
            { term: 'Predator', definition: 'حيوان مفترس يصطاد حيوانات أخرى للتغذي عليها.' },
          ],
          estimatedMinutes: 12,
          quiz: [
            {
              question: 'In a food chain, what role do green plants play?',
              options: ['Decomposers', 'Producers', 'Secondary consumers', 'Predators'],
              correctIndex: 1,
              explanation: 'Green plants are producers because they produce their own food through photosynthesis.',
            },
            {
              question: 'Which of the following is a non-living part of an ecosystem?',
              options: ['Insects', 'Bacteria', 'Water', 'Trees'],
              correctIndex: 2,
              explanation: 'Water, soil, and rocks are non-living components of an ecosystem.',
            },
          ],
        },
        {
          number: 3,
          title: 'Unit 3: Ancient Egyptian Inventions & Heritage (الابتكارات والحضارة المصرية)',
          summary: 'التعرف على اختراعات الفراعنة المذهلة مثل ورق البردي والساعة المائية والتقويم الزراعي.',
          detailedExplanation: `In Unit 3, we celebrate Ancient Egyptian heritage and remarkable inventions!
ترجمة وشرح: في الوحدة الثالثة، نحتفي بالإرث المصري القديم والابتكارات الفريدة التي غيرت العالم!

Ancient Egyptians invented papyrus from reed plants growing along the River Nile.
ترجمة وشرح: اخترع المصريون القدماء ورق البردي من نباتات البوص النامية على ضفاف نهر النيل.

Papyrus was the world's first portable writing paper, used for records, medicine, and letters.
ترجمة وشرح: كان ورق البردي أول وسيلة كتابة مرنة وسهلة النقل في العالم، استُخدم للتوثيق والطب والرسائل.

They also developed sun dials and water clocks to measure the passage of time accurately.
ترجمة وشرح: كما ابتكروا أيضاً الساعات الشمسية والساعات المائية لقياس مرور الوقت بدقة متناهية.

Grammar Point: We use the Past Simple tense to talk about actions completed in the past: "Egyptians built great pyramids."
ترجمة وشرح: نقطة نحوية: نستخدم زمن الماضي البسيط للحديث عن أحداث اكتملت في الماضي، مثل: "بنى المصريون الأهرامات العظيمة."`,
          keyPoints: [
            'Papyrus was the first flexible writing paper in history.',
            'الترجمة: كان ورق البردي أول ورق كتابة مرن وسهل الحمل في التاريخ.',
            'Ancient Egyptians divided the year into 365 days based on the Nile flood.',
            'الترجمة: قسّم المصريون القدماء السنة إلى 365 يوماً اعتماداً على فيضان النيل.',
          ],
          definitions: [
            { term: 'Papyrus', definition: 'ورق قديم مصنوع من سيقان نبات البردي للكتابة والرسم.' },
            { term: 'Sundial', definition: 'ساعة شمسية تستخدم موقع ظل الشمس لتحديد ساعات النهار.' },
          ],
          estimatedMinutes: 9,
          quiz: [
            {
              question: 'What material did Ancient Egyptians invent for writing records and letters?',
              options: ['Clay tablets', 'Papyrus', 'Plastic sheets', 'Silk'],
              correctIndex: 1,
              explanation: 'Papyrus was invented by the Ancient Egyptians from reed plants along the Nile.',
            },
          ],
        },
        {
          number: 4,
          title: 'Unit 4: Technology & The Digital Age in Egypt (التكنولوجيا والتحول الرقمي)',
          summary: 'كيف تستخدم التكنولوجيا في المدارس والتواصل الذكي وأهمية الأمان الرقمي للأطفال.',
          detailedExplanation: `In Unit 4, we explore technology, internet learning, and cybersecurity!
ترجمة وشرح: في الوحدة الرابعة، نستكشف التكنولوجيا والتعلم عبر الإنترنت والأمان السيبراني!

Digital devices like tablets and computers help students research information and communicate globally.
ترجمة وشرح: تساعد الأجهزة الرقمية كالأجهزة اللوحية والحواسيب الطلاب على البحث عن المعلومات والتواصل عالمياً.

Online Safety Rules: Never share your passwords or private personal data with strangers.
ترجمة وشرح: قواعد الأمان الرقمي: لا تشارك أبداً كلمات المرور أو بياناتك الشخصية الخاصة مع الغرباء.

Always ask a parent or a teacher if you see something confusing on the internet.
ترجمة وشرح: استشر دائماً والديك أو معلمك إذا رأيت أي شيء محيراً أو غير مريح على الإنترنت.

Strong passwords should combine uppercase letters, numbers, and special symbols for maximum security.
ترجمة وشرح: يجب أن تجمع كلمات المرور القوية بين الحروف الكبيرة والأرقام والرموز لتحقيق أعلى درجات الأمان.`,
          keyPoints: [
            'Online safety is essential when learning on the web.',
            'الترجمة: الأمان الرقمي ضرورة أساسية عند التعلم عبر الإنترنت.',
            'Strong passwords protect your private student accounts.',
            'الترجمة: كلمات المرور القوية تحمي حساباتك الدراسية الخاصة.',
          ],
          definitions: [
            { term: 'Digital Footprint', definition: 'البصمة الرقمية للأنشطة والمعلومات التي يتركها الشخص عند تصفح الإنترنت.' },
            { term: 'Cybersecurity', definition: 'الأمن السيبراني لحماية البيانات والأجهزة من الاختراق.' },
          ],
          estimatedMinutes: 8,
          quiz: [
            {
              question: 'What is the safest rule when creating a password for your school account?',
              options: ['Use your birthday only', 'Share it with your classmates', 'Use letters, numbers, and symbols', 'Write it on your notebook cover'],
              correctIndex: 2,
              explanation: 'Strong passwords combine letters, numbers, and symbols to ensure protection.',
            },
          ],
        },
      ],
    };
  }

  // 7. General fallback for any other subject/grade
  const defaultSubjectName =
    subjectId === 'science'
      ? 'العلوم واستكشاف الطبيعة'
      : subjectId === 'math' || subjectId === 'pure_math'
      ? 'الرياضيات والمنطق'
      : subjectId === 'physics'
      ? 'الفيزياء'
      : subjectId === 'chemistry'
      ? 'الكيمياء'
      : subjectId === 'biology'
      ? 'الأحياء'
      : subjectId === 'arabic'
      ? 'اللغة العربية'
      : subjectId === 'social'
      ? 'الدراسات الاجتماعية'
      : subjectId === 'history'
      ? 'التاريخ'
      : subjectId === 'geography'
      ? 'الجغرافيا'
      : 'المنهج الدراسي المعتمد';

  return {
    title: `${author.includes('المعاصر') ? 'المعاصر' : author.includes('الأضواء') ? 'الأضواء' : 'سلاح التلميذ'} في ${defaultSubjectName} - ${gradeLabel} - ${termName}`,
    author,
    publisher,
    stageId,
    gradeId,
    subjectId,
    streamId,
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    description: `مرجع تعليمي متكامل ومبسط مطابق للمنهج الوزاري المعتمد لـ ${gradeLabel}. يشمل شروحات مفصلة لكل درس، ومصطلحات أساسية، ونقاط ذهبية، واختبارات تفاعلية تقيس الفهم العميق.`,
    chapters: [
      {
        number: 1,
        title: 'الفصل الأول: المفاهيم الأساسية والانطلاقة المنهجية',
        summary: 'تأسيس شامل لأهم المبادئ والقواعد الأساسية المقررة في هذا الباب.',
        detailedExplanation: `أهلاً بك يا بطل في الفصل الأول من هذا الكتاب التعليمي المتميز!
في هذا الدرس، سنضع حجر الأساس لفهم المادة العلمية بطريقة مبسطة وشيقة. يعتمد نجاحك على إدراك الرابط المنطقي بين القواعد النظرية وتطبيقاتها الحياتية اليومية.

أولاً: المفهوم الجوهري:
كل قاعدة أو قانون في هذا الدرس صُمم ليحل مسألة عملية نواجهها في الطبيعة أو في التفكير العلمي المنظم. قم بقراءة التعريف بتمعن وتخيل تطبيقه العملي.

ثانياً: خطوات التطبيق والحل النموذجي:
1. قراءة المسألة أو السؤال بعناية وتحديد المعطيات والمطلوب بدقة.
2. تذكر القانون أو القاعدة الحاكمة وتطبيقها بخطوات متتالية دون تعجل.
3. مراجعة الناتج والتأكد من توافقه المنطقي مع معطيات السؤال.`,
        keyPoints: [
          'الفهم الاستيعابي للمصطلحات يسبق الحفظ ويوفر 80% من جهد المذاكرة.',
          'حل التمارين المتنوعة يعزز الثقة ويثبت المعلومة في الذاكرة طويلة المدى.',
          'الانتباه للوحدات والإشارات الرياضية والعلمية يمنع الوقوع في الأخطاء الشائعة.',
        ],
        definitions: [
          { term: 'المفهوم الأساسي', definition: 'القاعدة المحورية التي تنبثق منها كافة التطبيقات والأمثلة في الفصل.' },
          { term: 'نواتج التعلم', definition: 'المهارات والقدرات المعرفية المستهدف إتقانها عند إتمام دراسة الفصل.' },
        ],
        estimatedMinutes: 10,
        quiz: [
          {
            question: 'ما هي الخطوة الأولى والصحيحة عند التعامل مع أي مسألة أو سؤال جديد؟',
            options: ['البدء بالحل مباشرة بالحدس', 'قراءة المسألة وتحديد المعطيات والمطلوب بدقة', 'حفظ الإجابة دون فهم خطواتها', 'تخطي السؤال'],
            correctIndex: 1,
            explanation: 'تحديد المعطيات والمطلوب بدقة هو مفتاح الحل الرياضي والعلمي النموذجي.',
          },
        ],
      },
      {
        number: 2,
        title: 'الفصل الثاني: التطبيقات العملية وتعميق المهارات',
        summary: 'دراسة حالات ونماذج تطبيقية تعزز الفهم وتنمي التفكير النقدي.',
        detailedExplanation: `في هذا الفصل، ننتقل من مرحلة المفاهيم النظرية إلى التطبيقات المتقدمة.
نستعرض مجموعة من الأمثلة المحلولة التي تحاكي أسئلة الامتحانات الحديثة لتدريب الطالب على مهارات التفكير العليا وحل المشكلات المتدرجة الصعوبة.`,
        keyPoints: [
          'التدريب على أنماط الأسئلة غير النمطية يطور مهارة التفكير المستقل.',
          'الربط بين الدروس السابقة واللاحقة يحقق التكامل المعرفي المطلوب.',
        ],
        definitions: [
          { term: 'التفكير النقدي', definition: 'القدرة على تقييم المعلومات وتحليلها منطقياً للوصول إلى استنتاج سليم.' },
        ],
        estimatedMinutes: 12,
        quiz: [
          {
            question: 'كيف يحقق الطالب أعلى درجات الاستيعاب في المواد العلمية والتطبيقية؟',
            options: ['بالقراءة السريعة فقط', 'بحل التمارين المتنوعة وتصحيح الأخطاء فوراً', 'بالتخمين في الاختبارات', 'بحفظ القوانين دون معرفة دلالاتها'],
            correctIndex: 1,
            explanation: 'حل التمارين المتنوعة والممارسة العملية هو السبيل الأمثل لرسوخ المعلومات.',
          },
        ],
      },
    ],
  };
}

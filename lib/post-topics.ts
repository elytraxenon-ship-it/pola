export const POST_TOPICS = {
  developer: { id: "developer", labelKu: "پرۆگرامەرەکان" },
  design: { id: "graphic_designer", labelKu: "دیزاینەرەکان" },
  architecture: { id: "Architecture", labelKu: "تەلارسازی و بیناسازی" },
  medical: { id: "Medical", labelKu: "پزیشکی و تەندروستی" },
  fitness: { id: "sports", labelKu: "وەرزش و لەشجوانی" },
  history: { id: "History", labelKu: "مێژوو و شوێنەوار" },
  chemistry: { id: "Chemistry", labelKu: "کیمیا" },
  biology: { id: "Biology", labelKu: "بایۆلۆژی و ژینگە" },
  sport: { id: "Sport", labelKu: "وەرزش" },
  games: { id: "games", labelKu: "یارییەکان" },
  jobs: { id: "jobs", labelKu: "هەلی کار" },
  kurdish: { id: "kurdish", labelKu: "کورد و کوردزمان" },
} as const;

const topics = Object.values(POST_TOPICS);

function normalizeTopic(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[#_\s]/g, "");
}

export function getPostTopic(value: string) {
  const key = normalizeTopic(value);
  return topics.find(({ id, labelKu }) => normalizeTopic(id) === key || normalizeTopic(labelKu) === key);
}

export function findPostTopics(value: string) {
  const key = normalizeTopic(value);
  if (!key) return [];
  return topics.filter(({ id, labelKu }) =>
    normalizeTopic(id).includes(key) || normalizeTopic(labelKu).includes(key)
  );
}

export const SUBJECT_OPTIONS = {
  apology: [
    "late arrival to the office", 
    "late arrival to school", 
    "late arrival to college", 
    "missing an important deadline", 
    "inappropriate behavior", 
    "errors in my submitted work/assignment", 
    "Custom..."
  ],
  request: [
    "a leave of absence from the office", 
    "a leave of absence from school/college", 
    "a formal recommendation letter", 
    "a meeting appointment", 
    "a resource/equipment request", 
    "Custom..."
  ],
  complaint: [
    "a significant delay in service", 
    "the poor quality of products received", 
    "inadequate facilities provided", 
    "an issue with staff behavior", 
    "Custom..."
  ],
  thanks: [
    "your invaluable guidance", 
    "the professional opportunity provided", 
    "your continued support", 
    "your kind assistance", 
    "Custom..."
  ]
};

export const TITLES = ["Mr.", "Ms.", "Dr.", "Prof.", "The Principal", "The Manager", "Custom..."];

export const CATEGORIES = [
  { id: 'apology', label: 'Apology Letter' },
  { id: 'request', label: 'Formal Request' },
  { id: 'complaint', label: 'Complaint Letter' },
  { id: 'thanks', label: 'Thank You Note' }
];

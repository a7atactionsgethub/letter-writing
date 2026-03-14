export const SUBJECT_OPTIONS = {
  apology: [
    "Late arrival to Office", 
    "Late arrival to School", 
    "Late arrival to College", 
    "Missing an important deadline", 
    "Inappropriate behavior", 
    "Errors in submitted work/assignment", 
    "Custom..."
  ],
  request: [
    "Leave of absence (Office)", 
    "Leave of absence (School/College)", 
    "Request for recommendation letter", 
    "Meeting appointment request", 
    "Resource/Equipment request", 
    "Custom..."
  ],
  complaint: [
    "Service delay complaint", 
    "Poor quality of products", 
    "Inadequate facilities", 
    "Staff behavior issue", 
    "Custom..."
  ],
  thanks: [
    "Appreciation for guidance", 
    "Thank you for the opportunity", 
    "Acknowledgment of support", 
    "Personal thank you note", 
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

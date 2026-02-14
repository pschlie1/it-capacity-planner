// Resource Management Store - People, Skills, Assignments
import { v4 as uuid } from 'uuid';
import { getStore } from './store';

export type RoleType = 'Developer' | 'QA' | 'Architect' | 'PM' | 'Business Analyst' | 'DevOps' | 'DBA' | 'UX Designer' | 'Scrum Master' | 'Product Manager' | 'Data Engineer' | 'Security Engineer';
export type SeniorityLevel = 'Junior' | 'Mid' | 'Senior' | 'Lead' | 'Principal';

export interface ResourceSkill {
  name: string;
  proficiency: number; // 1-5
}

export interface PTOBlock {
  startWeek: number;
  endWeek: number;
  reason: string;
}

export interface ResourceAssignment {
  id: string;
  resourceId: string;
  projectId: string;
  role: string; // what role they play on this project
  allocationPct: number; // 0-100
  startWeek: number;
  endWeek: number;
}

export interface Resource {
  id: string;
  name: string;
  title: string;
  teamId: string;
  roleType: RoleType;
  seniority: SeniorityLevel;
  hireDate: string;
  hourlyCostRate: number;
  baseHoursPerWeek: number; // 40 for full-time, less for part-time
  skills: ResourceSkill[];
  ptoBlocks: PTOBlock[];
  avatarColor: string; // for UI
  email: string;
}

export interface ProjectSkillRequirement {
  projectId: string;
  skillName: string;
  minProficiency: number;
}

export interface ProductivitySettings {
  Junior: number;
  Mid: number;
  Senior: number;
  Lead: number;
  Principal: number;
  mentorshipOverheadPct: number; // % overhead on seniors when juniors on same project
}

const AVATAR_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#6366f1', '#14b8a6', '#e11d48', '#84cc16', '#0ea5e9', '#d946ef', '#22c55e', '#a855f7',
];

function createResourceSeedData() {
  const store = getStore();
  const teams = store.teams;
  const projects = store.projects;

  // Map team names to IDs
  const teamMap: Record<string, string> = {};
  teams.forEach(t => { teamMap[t.name] = t.id; });

  const web = teamMap['Web Platform'];
  const bizapps = teamMap['Business Applications'];
  const erp = teamMap['ERP & Supply Chain'];
  const data = teamMap['Data & Analytics'];
  const infra = teamMap['Infrastructure & Cloud'];
  const security = teamMap['Cybersecurity'];
  const mobile = teamMap['Mobile & Digital'];

  const resources: Resource[] = [
    // Web Platform (7 people)
    { id: uuid(), name: 'Alex Chen', title: 'Senior Frontend Developer', teamId: web, roleType: 'Developer', seniority: 'Senior', hireDate: '2021-03-15', hourlyCostRate: 85, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[0], email: 'achen@company.com', skills: [{ name: 'React', proficiency: 5 }, { name: 'TypeScript', proficiency: 5 }, { name: 'GraphQL', proficiency: 4 }, { name: 'Node.js', proficiency: 3 }, { name: 'AWS', proficiency: 2 }], ptoBlocks: [{ startWeek: 10, endWeek: 12, reason: 'Vacation' }] },
    { id: uuid(), name: 'Sarah Kim', title: 'Lead Full-Stack Developer', teamId: web, roleType: 'Developer', seniority: 'Lead', hireDate: '2019-06-01', hourlyCostRate: 105, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[1], email: 'skim@company.com', skills: [{ name: 'React', proficiency: 5 }, { name: 'TypeScript', proficiency: 5 }, { name: 'Node.js', proficiency: 5 }, { name: 'AWS', proficiency: 4 }, { name: 'GraphQL', proficiency: 4 }, { name: 'PostgreSQL', proficiency: 3 }], ptoBlocks: [] },
    { id: uuid(), name: 'Marcus Johnson', title: 'Junior Developer', teamId: web, roleType: 'Developer', seniority: 'Junior', hireDate: '2025-09-01', hourlyCostRate: 45, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[2], email: 'mjohnson@company.com', skills: [{ name: 'React', proficiency: 2 }, { name: 'TypeScript', proficiency: 2 }, { name: 'CSS', proficiency: 3 }], ptoBlocks: [] },
    { id: uuid(), name: 'Priya Sharma', title: 'Mid Developer', teamId: web, roleType: 'Developer', seniority: 'Mid', hireDate: '2023-01-10', hourlyCostRate: 65, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[3], email: 'psharma@company.com', skills: [{ name: 'React', proficiency: 4 }, { name: 'TypeScript', proficiency: 3 }, { name: 'Node.js', proficiency: 3 }, { name: 'AWS', proficiency: 2 }], ptoBlocks: [{ startWeek: 26, endWeek: 27, reason: 'Wedding' }] },
    { id: uuid(), name: 'David Park', title: 'Solutions Architect', teamId: web, roleType: 'Architect', seniority: 'Senior', hireDate: '2020-01-06', hourlyCostRate: 110, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[4], email: 'dpark@company.com', skills: [{ name: 'AWS', proficiency: 5 }, { name: 'React', proficiency: 3 }, { name: 'Node.js', proficiency: 4 }, { name: 'GraphQL', proficiency: 4 }, { name: 'Kubernetes', proficiency: 3 }], ptoBlocks: [] },
    { id: uuid(), name: 'Emily Wright', title: 'QA Engineer', teamId: web, roleType: 'QA', seniority: 'Mid', hireDate: '2022-05-15', hourlyCostRate: 60, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[5], email: 'ewright@company.com', skills: [{ name: 'Selenium', proficiency: 4 }, { name: 'Cypress', proficiency: 4 }, { name: 'TypeScript', proficiency: 3 }, { name: 'API Testing', proficiency: 3 }], ptoBlocks: [] },
    { id: uuid(), name: 'Tom Bradley', title: 'DevOps Engineer', teamId: web, roleType: 'DevOps', seniority: 'Senior', hireDate: '2020-08-01', hourlyCostRate: 90, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[6], email: 'tbradley@company.com', skills: [{ name: 'AWS', proficiency: 5 }, { name: 'Terraform', proficiency: 4 }, { name: 'Kubernetes', proficiency: 4 }, { name: 'CI/CD', proficiency: 5 }, { name: 'Linux', proficiency: 4 }], ptoBlocks: [] },

    // Business Applications (7 people)
    { id: uuid(), name: 'Jennifer Martinez', title: 'Senior Salesforce Developer', teamId: bizapps, roleType: 'Developer', seniority: 'Senior', hireDate: '2020-04-15', hourlyCostRate: 90, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[7], email: 'jmartinez@company.com', skills: [{ name: 'Salesforce', proficiency: 5 }, { name: 'Apex', proficiency: 5 }, { name: 'Lightning', proficiency: 4 }, { name: 'SQL Server', proficiency: 3 }], ptoBlocks: [] },
    { id: uuid(), name: 'Ryan O\'Brien', title: '.NET Developer', teamId: bizapps, roleType: 'Developer', seniority: 'Mid', hireDate: '2022-09-01', hourlyCostRate: 70, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[8], email: 'robrien@company.com', skills: [{ name: '.NET', proficiency: 4 }, { name: 'SQL Server', proficiency: 4 }, { name: 'C#', proficiency: 4 }, { name: 'Power Platform', proficiency: 2 }], ptoBlocks: [] },
    { id: uuid(), name: 'Lisa Chang', title: 'Business Analyst', teamId: bizapps, roleType: 'Business Analyst', seniority: 'Senior', hireDate: '2019-11-01', hourlyCostRate: 80, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[9], email: 'lchang@company.com', skills: [{ name: 'ServiceNow', proficiency: 4 }, { name: 'Salesforce', proficiency: 3 }, { name: 'Power Platform', proficiency: 4 }, { name: 'JIRA', proficiency: 5 }, { name: 'SQL Server', proficiency: 2 }], ptoBlocks: [{ startWeek: 20, endWeek: 21, reason: 'Conference' }] },
    { id: uuid(), name: 'Kevin Patel', title: 'ServiceNow Developer', teamId: bizapps, roleType: 'Developer', seniority: 'Mid', hireDate: '2023-03-15', hourlyCostRate: 75, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[10], email: 'kpatel@company.com', skills: [{ name: 'ServiceNow', proficiency: 4 }, { name: 'JavaScript', proficiency: 3 }, { name: 'ITIL', proficiency: 4 }], ptoBlocks: [] },
    { id: uuid(), name: 'Amanda Foster', title: 'QA Lead', teamId: bizapps, roleType: 'QA', seniority: 'Lead', hireDate: '2019-01-15', hourlyCostRate: 85, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[11], email: 'afoster@company.com', skills: [{ name: 'Test Automation', proficiency: 5 }, { name: 'Salesforce', proficiency: 3 }, { name: 'SQL Server', proficiency: 4 }, { name: 'API Testing', proficiency: 4 }], ptoBlocks: [] },
    { id: uuid(), name: 'Brian Scott', title: 'Project Manager', teamId: bizapps, roleType: 'PM', seniority: 'Senior', hireDate: '2020-02-01', hourlyCostRate: 90, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[12], email: 'bscott@company.com', skills: [{ name: 'JIRA', proficiency: 5 }, { name: 'Agile', proficiency: 5 }, { name: 'Salesforce', proficiency: 2 }, { name: 'ServiceNow', proficiency: 2 }], ptoBlocks: [] },
    { id: uuid(), name: 'Diana Reyes', title: 'Power Platform Developer', teamId: bizapps, roleType: 'Developer', seniority: 'Junior', hireDate: '2025-06-01', hourlyCostRate: 50, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[13], email: 'dreyes@company.com', skills: [{ name: 'Power Platform', proficiency: 3 }, { name: 'SharePoint', proficiency: 2 }, { name: '.NET', proficiency: 1 }], ptoBlocks: [] },

    // ERP & Supply Chain (8 people)
    { id: uuid(), name: 'Maria Rodriguez', title: 'Principal SAP Architect', teamId: erp, roleType: 'Architect', seniority: 'Principal', hireDate: '2016-03-01', hourlyCostRate: 140, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[14], email: 'mrodriguez@company.com', skills: [{ name: 'SAP S/4HANA', proficiency: 5 }, { name: 'SAP BTP', proficiency: 5 }, { name: 'ABAP', proficiency: 5 }, { name: 'SAP Fiori', proficiency: 4 }, { name: 'Data Migration', proficiency: 4 }], ptoBlocks: [{ startWeek: 16, endWeek: 17, reason: 'SAP Conference' }] },
    { id: uuid(), name: 'Robert Kim', title: 'Senior SAP Developer', teamId: erp, roleType: 'Developer', seniority: 'Senior', hireDate: '2018-07-01', hourlyCostRate: 95, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[15], email: 'rkim@company.com', skills: [{ name: 'ABAP', proficiency: 5 }, { name: 'SAP S/4HANA', proficiency: 4 }, { name: 'SAP Fiori', proficiency: 3 }, { name: 'EDI', proficiency: 3 }], ptoBlocks: [] },
    { id: uuid(), name: 'Carlos Mendez', title: 'SAP Developer', teamId: erp, roleType: 'Developer', seniority: 'Mid', hireDate: '2022-01-15', hourlyCostRate: 75, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[0], email: 'cmendez@company.com', skills: [{ name: 'ABAP', proficiency: 3 }, { name: 'SAP S/4HANA', proficiency: 3 }, { name: 'Data Migration', proficiency: 3 }, { name: 'Oracle', proficiency: 2 }], ptoBlocks: [] },
    { id: uuid(), name: 'Nina Petrova', title: 'Senior ERP Analyst', teamId: erp, roleType: 'Business Analyst', seniority: 'Senior', hireDate: '2019-04-01', hourlyCostRate: 85, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[1], email: 'npetrova@company.com', skills: [{ name: 'SAP S/4HANA', proficiency: 4 }, { name: 'Business Process', proficiency: 5 }, { name: 'Data Migration', proficiency: 4 }, { name: 'EDI', proficiency: 3 }], ptoBlocks: [] },
    { id: uuid(), name: 'Steve Thompson', title: 'SAP Developer', teamId: erp, roleType: 'Developer', seniority: 'Mid', hireDate: '2023-06-01', hourlyCostRate: 70, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[2], email: 'sthompson@company.com', skills: [{ name: 'ABAP', proficiency: 3 }, { name: 'SAP BTP', proficiency: 2 }, { name: 'SAP Fiori', proficiency: 3 }], ptoBlocks: [] },
    { id: uuid(), name: 'Helen Wu', title: 'QA Lead - ERP', teamId: erp, roleType: 'QA', seniority: 'Lead', hireDate: '2018-11-01', hourlyCostRate: 85, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[3], email: 'hwu@company.com', skills: [{ name: 'SAP Testing', proficiency: 5 }, { name: 'Data Migration', proficiency: 4 }, { name: 'Test Automation', proficiency: 3 }, { name: 'UAT', proficiency: 5 }], ptoBlocks: [] },
    { id: uuid(), name: 'Mike Davis', title: 'Senior PM - ERP', teamId: erp, roleType: 'PM', seniority: 'Senior', hireDate: '2017-09-01', hourlyCostRate: 100, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[4], email: 'mdavis@company.com', skills: [{ name: 'SAP S/4HANA', proficiency: 3 }, { name: 'Agile', proficiency: 4 }, { name: 'JIRA', proficiency: 5 }, { name: 'Waterfall', proficiency: 4 }], ptoBlocks: [] },
    { id: uuid(), name: 'Grace Lee', title: 'Junior SAP Developer', teamId: erp, roleType: 'Developer', seniority: 'Junior', hireDate: '2025-08-15', hourlyCostRate: 50, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[5], email: 'glee@company.com', skills: [{ name: 'ABAP', proficiency: 2 }, { name: 'SAP S/4HANA', proficiency: 1 }, { name: 'SQL', proficiency: 2 }], ptoBlocks: [] },

    // Data & Analytics (6 people)
    { id: uuid(), name: 'James Wilson', title: 'Lead Data Engineer', teamId: data, roleType: 'Data Engineer', seniority: 'Lead', hireDate: '2019-02-01', hourlyCostRate: 100, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[6], email: 'jwilson@company.com', skills: [{ name: 'Snowflake', proficiency: 5 }, { name: 'dbt', proficiency: 5 }, { name: 'Python', proficiency: 5 }, { name: 'Spark', proficiency: 4 }, { name: 'Airflow', proficiency: 4 }, { name: 'SQL', proficiency: 5 }], ptoBlocks: [{ startWeek: 22, endWeek: 24, reason: 'Paternity Leave' }] },
    { id: uuid(), name: 'Olivia Brown', title: 'Senior Data Analyst', teamId: data, roleType: 'Data Engineer', seniority: 'Senior', hireDate: '2020-06-15', hourlyCostRate: 85, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[7], email: 'obrown@company.com', skills: [{ name: 'Tableau', proficiency: 5 }, { name: 'Snowflake', proficiency: 4 }, { name: 'Python', proficiency: 3 }, { name: 'SQL', proficiency: 5 }, { name: 'dbt', proficiency: 3 }], ptoBlocks: [] },
    { id: uuid(), name: 'Daniel Garcia', title: 'Data Engineer', teamId: data, roleType: 'Data Engineer', seniority: 'Mid', hireDate: '2023-01-15', hourlyCostRate: 70, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[8], email: 'dgarcia@company.com', skills: [{ name: 'Python', proficiency: 4 }, { name: 'Spark', proficiency: 3 }, { name: 'Airflow', proficiency: 3 }, { name: 'Snowflake', proficiency: 3 }, { name: 'dbt', proficiency: 2 }], ptoBlocks: [] },
    { id: uuid(), name: 'Rachel Adams', title: 'DBA', teamId: data, roleType: 'DBA', seniority: 'Senior', hireDate: '2018-05-01', hourlyCostRate: 90, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[9], email: 'radams@company.com', skills: [{ name: 'PostgreSQL', proficiency: 5 }, { name: 'Snowflake', proficiency: 4 }, { name: 'Oracle', proficiency: 4 }, { name: 'SQL Server', proficiency: 3 }, { name: 'Data Migration', proficiency: 4 }], ptoBlocks: [] },
    { id: uuid(), name: 'Andrew Taylor', title: 'ML Engineer', teamId: data, roleType: 'Data Engineer', seniority: 'Mid', hireDate: '2024-02-01', hourlyCostRate: 80, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[10], email: 'ataylor@company.com', skills: [{ name: 'Python', proficiency: 5 }, { name: 'TensorFlow', proficiency: 4 }, { name: 'Spark', proficiency: 3 }, { name: 'MLOps', proficiency: 3 }, { name: 'SQL', proficiency: 3 }], ptoBlocks: [] },
    { id: uuid(), name: 'Sophia Nguyen', title: 'Junior Data Analyst', teamId: data, roleType: 'Data Engineer', seniority: 'Junior', hireDate: '2025-10-01', hourlyCostRate: 45, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[11], email: 'snguyen@company.com', skills: [{ name: 'SQL', proficiency: 3 }, { name: 'Tableau', proficiency: 2 }, { name: 'Python', proficiency: 2 }], ptoBlocks: [] },

    // Infrastructure & Cloud (6 people)
    { id: uuid(), name: 'Chris Anderson', title: 'Principal Cloud Architect', teamId: infra, roleType: 'Architect', seniority: 'Principal', hireDate: '2015-11-01', hourlyCostRate: 135, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[12], email: 'canderson@company.com', skills: [{ name: 'AWS', proficiency: 5 }, { name: 'Azure', proficiency: 5 }, { name: 'Terraform', proficiency: 5 }, { name: 'Kubernetes', proficiency: 5 }, { name: 'Networking', proficiency: 4 }, { name: 'Linux', proficiency: 5 }], ptoBlocks: [] },
    { id: uuid(), name: 'Jessica Hall', title: 'Senior DevOps Engineer', teamId: infra, roleType: 'DevOps', seniority: 'Senior', hireDate: '2020-03-15', hourlyCostRate: 90, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[13], email: 'jhall@company.com', skills: [{ name: 'Kubernetes', proficiency: 5 }, { name: 'AWS', proficiency: 4 }, { name: 'Terraform', proficiency: 4 }, { name: 'CI/CD', proficiency: 5 }, { name: 'Linux', proficiency: 4 }], ptoBlocks: [] },
    { id: uuid(), name: 'Nathan Brooks', title: 'Cloud Engineer', teamId: infra, roleType: 'DevOps', seniority: 'Mid', hireDate: '2022-08-01', hourlyCostRate: 75, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[14], email: 'nbrooks@company.com', skills: [{ name: 'AWS', proficiency: 4 }, { name: 'Terraform', proficiency: 3 }, { name: 'Linux', proficiency: 4 }, { name: 'Networking', proficiency: 3 }, { name: 'Docker', proficiency: 4 }], ptoBlocks: [] },
    { id: uuid(), name: 'Michael Torres', title: 'DevOps Engineer', teamId: infra, roleType: 'DevOps', seniority: 'Mid', hireDate: '2023-04-01', hourlyCostRate: 70, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[15], email: 'mtorres@company.com', skills: [{ name: 'Azure', proficiency: 4 }, { name: 'Kubernetes', proficiency: 3 }, { name: 'CI/CD', proficiency: 4 }, { name: 'Terraform', proficiency: 2 }, { name: 'Linux', proficiency: 3 }], ptoBlocks: [] },
    { id: uuid(), name: 'Laura White', title: 'Network Engineer', teamId: infra, roleType: 'DevOps', seniority: 'Senior', hireDate: '2018-12-01', hourlyCostRate: 85, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[0], email: 'lwhite@company.com', skills: [{ name: 'Networking', proficiency: 5 }, { name: 'AWS', proficiency: 3 }, { name: 'Linux', proficiency: 4 }, { name: 'Security', proficiency: 3 }], ptoBlocks: [{ startWeek: 30, endWeek: 31, reason: 'Vacation' }] },
    { id: uuid(), name: 'Ben Carter', title: 'Junior SRE', teamId: infra, roleType: 'DevOps', seniority: 'Junior', hireDate: '2025-07-01', hourlyCostRate: 50, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[1], email: 'bcarter@company.com', skills: [{ name: 'Linux', proficiency: 3 }, { name: 'AWS', proficiency: 2 }, { name: 'Docker', proficiency: 2 }, { name: 'Python', proficiency: 2 }], ptoBlocks: [] },

    // Cybersecurity (5 people)
    { id: uuid(), name: 'Samantha Reed', title: 'Lead Security Architect', teamId: security, roleType: 'Security Engineer', seniority: 'Lead', hireDate: '2018-01-15', hourlyCostRate: 115, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[2], email: 'sreed@company.com', skills: [{ name: 'Zero Trust', proficiency: 5 }, { name: 'IAM', proficiency: 5 }, { name: 'SIEM', proficiency: 4 }, { name: 'Penetration Testing', proficiency: 4 }, { name: 'Compliance', proficiency: 4 }], ptoBlocks: [] },
    { id: uuid(), name: 'Tyler Jackson', title: 'Senior Security Engineer', teamId: security, roleType: 'Security Engineer', seniority: 'Senior', hireDate: '2020-07-01', hourlyCostRate: 95, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[3], email: 'tjackson@company.com', skills: [{ name: 'Penetration Testing', proficiency: 5 }, { name: 'SIEM', proficiency: 4 }, { name: 'IAM', proficiency: 3 }, { name: 'Compliance', proficiency: 3 }, { name: 'Zero Trust', proficiency: 3 }], ptoBlocks: [] },
    { id: uuid(), name: 'Ashley Morgan', title: 'Security Analyst', teamId: security, roleType: 'Security Engineer', seniority: 'Mid', hireDate: '2023-02-15', hourlyCostRate: 70, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[4], email: 'amorgan@company.com', skills: [{ name: 'SIEM', proficiency: 4 }, { name: 'Compliance', proficiency: 4 }, { name: 'IAM', proficiency: 3 }, { name: 'Security', proficiency: 3 }], ptoBlocks: [] },
    { id: uuid(), name: 'Patrick O\'Neill', title: 'Compliance Specialist', teamId: security, roleType: 'Business Analyst', seniority: 'Senior', hireDate: '2019-09-01', hourlyCostRate: 85, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[5], email: 'poneill@company.com', skills: [{ name: 'Compliance', proficiency: 5 }, { name: 'SOX', proficiency: 5 }, { name: 'SOC2', proficiency: 5 }, { name: 'GDPR', proficiency: 4 }], ptoBlocks: [] },
    { id: uuid(), name: 'Jordan Hayes', title: 'Junior Security Engineer', teamId: security, roleType: 'Security Engineer', seniority: 'Junior', hireDate: '2025-11-01', hourlyCostRate: 50, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[6], email: 'jhayes@company.com', skills: [{ name: 'SIEM', proficiency: 2 }, { name: 'IAM', proficiency: 2 }, { name: 'Linux', proficiency: 2 }], ptoBlocks: [] },

    // Mobile & Digital (5 people)
    { id: uuid(), name: 'Megan Liu', title: 'Senior Mobile Developer', teamId: mobile, roleType: 'Developer', seniority: 'Senior', hireDate: '2020-05-01', hourlyCostRate: 90, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[7], email: 'mliu@company.com', skills: [{ name: 'React Native', proficiency: 5 }, { name: 'Swift', proficiency: 4 }, { name: 'Kotlin', proficiency: 3 }, { name: 'Firebase', proficiency: 4 }, { name: 'TypeScript', proficiency: 4 }], ptoBlocks: [] },
    { id: uuid(), name: 'Jake Robinson', title: 'iOS Developer', teamId: mobile, roleType: 'Developer', seniority: 'Mid', hireDate: '2022-11-01', hourlyCostRate: 70, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[8], email: 'jrobinson@company.com', skills: [{ name: 'Swift', proficiency: 5 }, { name: 'React Native', proficiency: 3 }, { name: 'Firebase', proficiency: 3 }, { name: 'Kotlin', proficiency: 2 }], ptoBlocks: [] },
    { id: uuid(), name: 'Aisha Khan', title: 'UX Designer', teamId: mobile, roleType: 'UX Designer', seniority: 'Senior', hireDate: '2019-08-15', hourlyCostRate: 85, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[9], email: 'akhan@company.com', skills: [{ name: 'Figma', proficiency: 5 }, { name: 'User Research', proficiency: 5 }, { name: 'Prototyping', proficiency: 4 }, { name: 'React Native', proficiency: 2 }], ptoBlocks: [{ startWeek: 14, endWeek: 15, reason: 'Vacation' }] },
    { id: uuid(), name: 'Eric Yamamoto', title: 'Product Manager', teamId: mobile, roleType: 'Product Manager', seniority: 'Senior', hireDate: '2020-01-15', hourlyCostRate: 95, baseHoursPerWeek: 40, avatarColor: AVATAR_COLORS[10], email: 'eyamamoto@company.com', skills: [{ name: 'Product Strategy', proficiency: 5 }, { name: 'Agile', proficiency: 4 }, { name: 'Analytics', proficiency: 4 }, { name: 'User Research', proficiency: 3 }], ptoBlocks: [] },
    { id: uuid(), name: 'Zoe Campbell', title: 'QA Engineer - Mobile', teamId: mobile, roleType: 'QA', seniority: 'Mid', hireDate: '2023-05-15', hourlyCostRate: 60, baseHoursPerWeek: 32, avatarColor: AVATAR_COLORS[11], email: 'zcampbell@company.com', skills: [{ name: 'Mobile Testing', proficiency: 4 }, { name: 'Appium', proficiency: 3 }, { name: 'API Testing', proficiency: 3 }], ptoBlocks: [] },
  ];

  // Resource assignments - pre-built for active projects
  const assignments: ResourceAssignment[] = [];

  // Helper: find resource by name
  const r = (name: string) => resources.find(res => res.name === name)!;
  const p = (idx: number) => projects[idx];

  // Customer Portal Redesign (P1) - Web + Security
  assignments.push(
    { id: uuid(), resourceId: r('Sarah Kim').id, projectId: p(0).id, role: 'Tech Lead', allocationPct: 60, startWeek: 0, endWeek: 28 },
    { id: uuid(), resourceId: r('Alex Chen').id, projectId: p(0).id, role: 'Frontend Dev', allocationPct: 80, startWeek: 2, endWeek: 28 },
    { id: uuid(), resourceId: r('Priya Sharma').id, projectId: p(0).id, role: 'Frontend Dev', allocationPct: 50, startWeek: 4, endWeek: 24 },
    { id: uuid(), resourceId: r('David Park').id, projectId: p(0).id, role: 'Architecture', allocationPct: 30, startWeek: 0, endWeek: 8 },
    { id: uuid(), resourceId: r('Emily Wright').id, projectId: p(0).id, role: 'QA', allocationPct: 60, startWeek: 8, endWeek: 28 },
    { id: uuid(), resourceId: r('Tom Bradley').id, projectId: p(0).id, role: 'DevOps', allocationPct: 20, startWeek: 18, endWeek: 28 },
    { id: uuid(), resourceId: r('Samantha Reed').id, projectId: p(0).id, role: 'Security Review', allocationPct: 15, startWeek: 6, endWeek: 20 },
  );

  // SAP S/4HANA Migration (P2) - ERP + Infra + Security + Data
  assignments.push(
    { id: uuid(), resourceId: r('Maria Rodriguez').id, projectId: p(1).id, role: 'Solution Architect', allocationPct: 70, startWeek: 0, endWeek: 48 },
    { id: uuid(), resourceId: r('Robert Kim').id, projectId: p(1).id, role: 'Lead Developer', allocationPct: 80, startWeek: 0, endWeek: 48 },
    { id: uuid(), resourceId: r('Carlos Mendez').id, projectId: p(1).id, role: 'Developer', allocationPct: 70, startWeek: 4, endWeek: 40 },
    { id: uuid(), resourceId: r('Steve Thompson').id, projectId: p(1).id, role: 'Developer', allocationPct: 60, startWeek: 8, endWeek: 44 },
    { id: uuid(), resourceId: r('Nina Petrova').id, projectId: p(1).id, role: 'Business Analyst', allocationPct: 80, startWeek: 0, endWeek: 40 },
    { id: uuid(), resourceId: r('Helen Wu').id, projectId: p(1).id, role: 'QA Lead', allocationPct: 70, startWeek: 12, endWeek: 48 },
    { id: uuid(), resourceId: r('Mike Davis').id, projectId: p(1).id, role: 'Project Manager', allocationPct: 80, startWeek: 0, endWeek: 48 },
    { id: uuid(), resourceId: r('Grace Lee').id, projectId: p(1).id, role: 'Junior Developer', allocationPct: 100, startWeek: 8, endWeek: 44 },
    { id: uuid(), resourceId: r('Chris Anderson').id, projectId: p(1).id, role: 'Cloud Infra', allocationPct: 20, startWeek: 4, endWeek: 30 },
    { id: uuid(), resourceId: r('Rachel Adams').id, projectId: p(1).id, role: 'Data Migration', allocationPct: 40, startWeek: 16, endWeek: 36 },
  );

  // Data Lakehouse (P3) - Data + Infra
  assignments.push(
    { id: uuid(), resourceId: r('James Wilson').id, projectId: p(2).id, role: 'Tech Lead', allocationPct: 70, startWeek: 2, endWeek: 32 },
    { id: uuid(), resourceId: r('Daniel Garcia').id, projectId: p(2).id, role: 'Data Engineer', allocationPct: 80, startWeek: 4, endWeek: 30 },
    { id: uuid(), resourceId: r('Olivia Brown').id, projectId: p(2).id, role: 'Analytics', allocationPct: 40, startWeek: 12, endWeek: 32 },
    { id: uuid(), resourceId: r('Andrew Taylor').id, projectId: p(2).id, role: 'ML Pipeline', allocationPct: 30, startWeek: 16, endWeek: 30 },
    { id: uuid(), resourceId: r('Nathan Brooks').id, projectId: p(2).id, role: 'Infra', allocationPct: 25, startWeek: 2, endWeek: 20 },
  );

  // Zero Trust (P4) - Security + Infra
  assignments.push(
    { id: uuid(), resourceId: r('Samantha Reed').id, projectId: p(3).id, role: 'Lead Architect', allocationPct: 50, startWeek: 0, endWeek: 30 },
    { id: uuid(), resourceId: r('Tyler Jackson').id, projectId: p(3).id, role: 'Security Engineer', allocationPct: 70, startWeek: 0, endWeek: 30 },
    { id: uuid(), resourceId: r('Ashley Morgan').id, projectId: p(3).id, role: 'Security Analyst', allocationPct: 60, startWeek: 2, endWeek: 28 },
    { id: uuid(), resourceId: r('Jordan Hayes').id, projectId: p(3).id, role: 'Support', allocationPct: 80, startWeek: 4, endWeek: 28 },
    { id: uuid(), resourceId: r('Jessica Hall').id, projectId: p(3).id, role: 'DevOps Integration', allocationPct: 30, startWeek: 6, endWeek: 24 },
    { id: uuid(), resourceId: r('Laura White').id, projectId: p(3).id, role: 'Network Security', allocationPct: 40, startWeek: 8, endWeek: 24 },
  );

  // Mobile App Platform (P5) - Mobile + Web
  assignments.push(
    { id: uuid(), resourceId: r('Megan Liu').id, projectId: p(4).id, role: 'Tech Lead', allocationPct: 70, startWeek: 4, endWeek: 30 },
    { id: uuid(), resourceId: r('Jake Robinson').id, projectId: p(4).id, role: 'iOS Developer', allocationPct: 80, startWeek: 6, endWeek: 28 },
    { id: uuid(), resourceId: r('Aisha Khan').id, projectId: p(4).id, role: 'UX Design', allocationPct: 60, startWeek: 4, endWeek: 14 },
    { id: uuid(), resourceId: r('Eric Yamamoto').id, projectId: p(4).id, role: 'Product Manager', allocationPct: 50, startWeek: 4, endWeek: 30 },
    { id: uuid(), resourceId: r('Zoe Campbell').id, projectId: p(4).id, role: 'QA', allocationPct: 70, startWeek: 12, endWeek: 30 },
    { id: uuid(), resourceId: r('Priya Sharma').id, projectId: p(4).id, role: 'API Integration', allocationPct: 30, startWeek: 10, endWeek: 24 },
  );

  // Salesforce CPQ (P12) - BizApps
  assignments.push(
    { id: uuid(), resourceId: r('Jennifer Martinez').id, projectId: p(11).id, role: 'Lead Developer', allocationPct: 60, startWeek: 6, endWeek: 28 },
    { id: uuid(), resourceId: r('Lisa Chang').id, projectId: p(11).id, role: 'Business Analyst', allocationPct: 40, startWeek: 6, endWeek: 20 },
    { id: uuid(), resourceId: r('Amanda Foster').id, projectId: p(11).id, role: 'QA', allocationPct: 30, startWeek: 14, endWeek: 28 },
  );

  // SOX/SOC2 Compliance (P9) - Security + BizApps
  assignments.push(
    { id: uuid(), resourceId: r('Patrick O\'Neill').id, projectId: p(8).id, role: 'Compliance Lead', allocationPct: 60, startWeek: 4, endWeek: 22 },
    { id: uuid(), resourceId: r('Ashley Morgan').id, projectId: p(8).id, role: 'Security Analyst', allocationPct: 20, startWeek: 4, endWeek: 22 },
    { id: uuid(), resourceId: r('Kevin Patel').id, projectId: p(8).id, role: 'ServiceNow Config', allocationPct: 40, startWeek: 8, endWeek: 22 },
  );

  // Project skill requirements
  const projectSkillReqs: ProjectSkillRequirement[] = [
    // Customer Portal Redesign
    { projectId: p(0).id, skillName: 'React', minProficiency: 4 },
    { projectId: p(0).id, skillName: 'TypeScript', minProficiency: 3 },
    { projectId: p(0).id, skillName: 'AWS', minProficiency: 3 },
    { projectId: p(0).id, skillName: 'GraphQL', minProficiency: 3 },
    // SAP Migration
    { projectId: p(1).id, skillName: 'SAP S/4HANA', minProficiency: 4 },
    { projectId: p(1).id, skillName: 'ABAP', minProficiency: 4 },
    { projectId: p(1).id, skillName: 'Data Migration', minProficiency: 3 },
    { projectId: p(1).id, skillName: 'SAP BTP', minProficiency: 3 },
    // Data Lakehouse
    { projectId: p(2).id, skillName: 'Snowflake', minProficiency: 4 },
    { projectId: p(2).id, skillName: 'dbt', minProficiency: 3 },
    { projectId: p(2).id, skillName: 'Python', minProficiency: 3 },
    { projectId: p(2).id, skillName: 'Airflow', minProficiency: 3 },
    // Zero Trust
    { projectId: p(3).id, skillName: 'Zero Trust', minProficiency: 4 },
    { projectId: p(3).id, skillName: 'IAM', minProficiency: 4 },
    { projectId: p(3).id, skillName: 'SIEM', minProficiency: 3 },
    // Mobile App
    { projectId: p(4).id, skillName: 'React Native', minProficiency: 4 },
    { projectId: p(4).id, skillName: 'Swift', minProficiency: 3 },
    { projectId: p(4).id, skillName: 'Firebase', minProficiency: 3 },
    // API Gateway
    { projectId: p(5).id, skillName: 'AWS', minProficiency: 4 },
    { projectId: p(5).id, skillName: 'Node.js', minProficiency: 4 },
    { projectId: p(5).id, skillName: 'Kubernetes', minProficiency: 3 },
    // AI/ML Platform
    { projectId: p(6).id, skillName: 'Python', minProficiency: 4 },
    { projectId: p(6).id, skillName: 'Spark', minProficiency: 3 },
    { projectId: p(6).id, skillName: 'MLOps', minProficiency: 3 },
    // Legacy Decommission
    { projectId: p(7).id, skillName: '.NET', minProficiency: 3 },
    { projectId: p(7).id, skillName: 'SQL Server', minProficiency: 3 },
    // SOX/SOC2
    { projectId: p(8).id, skillName: 'Compliance', minProficiency: 4 },
    { projectId: p(8).id, skillName: 'SOX', minProficiency: 4 },
    // Employee Portal
    { projectId: p(9).id, skillName: 'React', minProficiency: 3 },
    { projectId: p(9).id, skillName: 'ServiceNow', minProficiency: 3 },
    // Cloud Cost Opt
    { projectId: p(10).id, skillName: 'AWS', minProficiency: 4 },
    { projectId: p(10).id, skillName: 'Terraform', minProficiency: 3 },
    // Salesforce CPQ
    { projectId: p(11).id, skillName: 'Salesforce', minProficiency: 5 },
    { projectId: p(11).id, skillName: 'Apex', minProficiency: 4 },
    // DR Modernization
    { projectId: p(12).id, skillName: 'AWS', minProficiency: 4 },
    { projectId: p(12).id, skillName: 'Networking', minProficiency: 4 },
    // WMS
    { projectId: p(13).id, skillName: 'SAP S/4HANA', minProficiency: 4 },
    { projectId: p(13).id, skillName: 'EDI', minProficiency: 3 },
    // Board Dashboard
    { projectId: p(14).id, skillName: 'Tableau', minProficiency: 4 },
    { projectId: p(14).id, skillName: 'Snowflake', minProficiency: 3 },
    // eCommerce
    { projectId: p(19).id, skillName: 'React', minProficiency: 5 },
    { projectId: p(19).id, skillName: 'TypeScript', minProficiency: 4 },
    { projectId: p(19).id, skillName: 'GraphQL', minProficiency: 4 },
  ];

  const productivitySettings: ProductivitySettings = {
    Junior: 0.5,
    Mid: 0.75,
    Senior: 1.0,
    Lead: 1.1,
    Principal: 1.2,
    mentorshipOverheadPct: 15,
  };

  return { resources, assignments, projectSkillReqs, productivitySettings };
}

// Singleton
let resourceData: ReturnType<typeof createResourceSeedData> | null = null;

function getData() {
  if (!resourceData) {
    resourceData = createResourceSeedData();
  }
  return resourceData;
}

// Resource CRUD
export function getResources() { return getData().resources; }
export function getResource(id: string) { return getData().resources.find(r => r.id === id); }
export function createResource(data: Omit<Resource, 'id'>) {
  const resource = { ...data, id: uuid() };
  getData().resources.push(resource);
  return resource;
}
export function updateResource(id: string, data: Partial<Resource>) {
  const resources = getData().resources;
  const idx = resources.findIndex(r => r.id === id);
  if (idx >= 0) resources[idx] = { ...resources[idx], ...data };
  return resources[idx];
}

// Assignments CRUD
export function getAssignments(filters?: { resourceId?: string; projectId?: string }) {
  let result = getData().assignments;
  if (filters?.resourceId) result = result.filter(a => a.resourceId === filters.resourceId);
  if (filters?.projectId) result = result.filter(a => a.projectId === filters.projectId);
  return result;
}
export function createAssignment(data: Omit<ResourceAssignment, 'id'>) {
  const assignment = { ...data, id: uuid() };
  getData().assignments.push(assignment);
  return assignment;
}
export function deleteAssignment(id: string) {
  const assignments = getData().assignments;
  const idx = assignments.findIndex(a => a.id === id);
  if (idx >= 0) assignments.splice(idx, 1);
}

// Skill requirements
export function getProjectSkillRequirements(projectId?: string) {
  const reqs = getData().projectSkillReqs;
  return projectId ? reqs.filter(r => r.projectId === projectId) : reqs;
}

// Productivity settings
export function getProductivitySettings() { return getData().productivitySettings; }
export function updateProductivitySettings(data: Partial<ProductivitySettings>) {
  Object.assign(getData().productivitySettings, data);
  return getData().productivitySettings;
}

// Analytics helpers
export function getResourceUtilization(resourceId: string, week: number): number {
  const assignments = getAssignments({ resourceId });
  return assignments
    .filter(a => week >= a.startWeek && week <= a.endWeek)
    .reduce((sum, a) => sum + a.allocationPct, 0);
}

export function getResourceWeeklyUtilization(resourceId: string): number[] {
  const weeks: number[] = [];
  for (let w = 0; w < 52; w++) {
    weeks.push(getResourceUtilization(resourceId, w));
  }
  return weeks;
}

export function getOverallocatedResources(): { resource: Resource; week: number; totalPct: number }[] {
  const results: { resource: Resource; week: number; totalPct: number }[] = [];
  const resources = getResources();
  for (const res of resources) {
    for (let w = 0; w < 52; w++) {
      const util = getResourceUtilization(res.id, w);
      if (util > 100) {
        results.push({ resource: res, week: w, totalPct: util });
      }
    }
  }
  return results;
}

export function getSkillGaps(projectId: string): { skillName: string; minProficiency: number; availableResources: { resource: Resource; proficiency: number }[]; gap: boolean }[] {
  const reqs = getProjectSkillRequirements(projectId);
  const resources = getResources();
  return reqs.map(req => {
    const available = resources
      .filter(r => r.skills.some(s => s.name === req.skillName && s.proficiency >= req.minProficiency))
      .map(r => ({ resource: r, proficiency: r.skills.find(s => s.name === req.skillName)!.proficiency }));
    return { skillName: req.skillName, minProficiency: req.minProficiency, availableResources: available, gap: available.length === 0 };
  });
}

export function getSinglePointsOfFailure(): { skillName: string; resource: Resource; projects: string[] }[] {
  const resources = getResources();
  const reqs = getProjectSkillRequirements();
  const projects = getStore().projects;

  // Find skills required by projects where only 1 person qualifies
  const skillMap: Record<string, Resource[]> = {};
  for (const req of reqs) {
    if (!skillMap[req.skillName]) {
      skillMap[req.skillName] = resources.filter(r =>
        r.skills.some(s => s.name === req.skillName && s.proficiency >= req.minProficiency)
      );
    }
  }

  const results: { skillName: string; resource: Resource; projects: string[] }[] = [];
  const seen = new Set<string>();
  for (const [skillName, qualified] of Object.entries(skillMap)) {
    if (qualified.length === 1 && !seen.has(skillName)) {
      seen.add(skillName);
      const affectedProjects = reqs
        .filter(r => r.skillName === skillName)
        .map(r => projects.find(p => p.id === r.projectId)?.name || 'Unknown');
      results.push({ skillName, resource: qualified[0], projects: affectedProjects });
    }
  }
  return results;
}

export function getAllSkills(): string[] {
  const resources = getResources();
  const skillSet = new Set<string>();
  resources.forEach(r => r.skills.forEach(s => skillSet.add(s.name)));
  return Array.from(skillSet).sort();
}

export function getSkillMatrix(): { skill: string; teams: Record<string, { count: number; maxProficiency: number; avgProficiency: number; people: string[] }> }[] {
  const resources = getResources();
  const teams = getStore().teams;
  const skills = getAllSkills();

  return skills.map(skill => {
    const teamData: Record<string, { count: number; maxProficiency: number; avgProficiency: number; people: string[] }> = {};
    for (const team of teams) {
      const teamResources = resources.filter(r => r.teamId === team.id && r.skills.some(s => s.name === skill));
      if (teamResources.length > 0) {
        const proficiencies = teamResources.map(r => r.skills.find(s => s.name === skill)!.proficiency);
        teamData[team.id] = {
          count: teamResources.length,
          maxProficiency: Math.max(...proficiencies),
          avgProficiency: proficiencies.reduce((a, b) => a + b, 0) / proficiencies.length,
          people: teamResources.map(r => r.name),
        };
      }
    }
    return { skill, teams: teamData };
  });
}

export function getRecommendedAssignments(projectId: string): { skill: string; recommended: { resource: Resource; score: number; reason: string }[] }[] {
  const reqs = getProjectSkillRequirements(projectId);
  const resources = getResources();
  const assignments = getAssignments();

  return reqs.map(req => {
    const candidates = resources
      .filter(r => r.skills.some(s => s.name === req.skillName && s.proficiency >= req.minProficiency))
      .map(r => {
        const skill = r.skills.find(s => s.name === req.skillName)!;
        // Calculate average utilization during a hypothetical assignment window
        const utilization = getResourceWeeklyUtilization(r.id);
        const avgUtil = utilization.reduce((a, b) => a + b, 0) / 52;
        const seniorityMultiplier = { Junior: 0.5, Mid: 0.75, Senior: 1.0, Lead: 1.1, Principal: 1.2 }[r.seniority];
        const score = (skill.proficiency / 5) * 40 + ((100 - avgUtil) / 100) * 40 + seniorityMultiplier * 20;
        const reason = `${req.skillName}: ${skill.proficiency}/5, ${avgUtil.toFixed(0)}% utilized, ${r.seniority}`;
        return { resource: r, score, reason };
      })
      .sort((a, b) => b.score - a.score);

    return { skill: req.skillName, recommended: candidates.slice(0, 3) };
  });
}

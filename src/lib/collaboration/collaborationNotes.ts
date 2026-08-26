/**
 * NextHire Phase 13 — Collaborative Candidate Notes & Mentions
 * Internal candidate/application notes with @mention parsing and company-isolated visibility.
 */

import { prisma } from "@/lib/prisma";
import { emitEvent as emitAppEvent } from "@/lib/events/eventEngine";
import { CollaborationNoteRecord, CollaborationNoteType } from "./types";

export interface CreateCollaborationNoteInput {
  companyId: string;
  authorId: string;
  candidateId: string;
  applicationId?: string | null;
  jobId?: string | null;
  noteType?: CollaborationNoteType;
  content: string;
}

/**
 * Creates an internal collaboration note, parses @mentions, and notifies mentioned recruiters.
 */
export async function createCollaborationNote(
  input: CreateCollaborationNoteInput
): Promise<CollaborationNoteRecord> {
  const {
    companyId,
    authorId,
    candidateId,
    applicationId,
    jobId,
    noteType = "GENERAL",
    content,
  } = input;

  // Validate author
  const author = await prisma.user.findFirst({
    where: { id: authorId, companyId, role: { in: ["RECRUITER", "COMPANY_ADMIN"] } },
    select: { id: true, name: true },
  });
  if (!author) {
    throw new Error("Author does not belong to this company or lacks recruiter role.");
  }

  // Validate candidate
  const candidate = await prisma.user.findUnique({
    where: { id: candidateId },
    select: { id: true, name: true },
  });
  if (!candidate) {
    throw new Error("Candidate not found.");
  }

  // Parse mentions (@Name or @email)
  const mentionMatches = content.match(/@([\w\.\-]+)/g) || [];
  const mentionedTerms = Array.from(new Set(mentionMatches.map((m) => m.slice(1).toLowerCase())));

  const companyRecruiters = await prisma.user.findMany({
    where: {
      companyId,
      role: { in: ["RECRUITER", "COMPANY_ADMIN"] },
    },
    select: { id: true, name: true, email: true },
  });

  const mentions: Array<{ userId: string; name: string }> = [];
  for (const term of mentionedTerms) {
    const matchedUser = companyRecruiters.find(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term) ||
        r.name.toLowerCase().replace(/\s+/g, "").includes(term)
    );
    if (matchedUser && matchedUser.id !== authorId) {
      if (!mentions.some((m) => m.userId === matchedUser.id)) {
        mentions.push({ userId: matchedUser.id, name: matchedUser.name });
      }
    }
  }

  // Create note
  const note = await prisma.collaborationNote.create({
    data: {
      companyId,
      authorId,
      candidateId,
      applicationId: applicationId || null,
      jobId: jobId || null,
      noteType,
      content,
      mentions: JSON.stringify(mentions),
    },
    include: {
      author: { select: { name: true } },
      candidate: { select: { name: true } },
    },
  });

  let jobTitle: string | null = null;
  if (jobId) {
    const job = await prisma.job.findUnique({ where: { id: jobId }, select: { title: true } });
    jobTitle = job?.title || null;
  }

  // Emit mention notifications
  for (const m of mentions) {
    await emitAppEvent({
      type: "RECRUITER_MENTIONED",
      recipientId: m.userId,
      actorId: authorId,
      companyId,
      entityType: "CANDIDATE",
      entityId: candidateId,
      title: `${author.name} mentioned you on ${candidate.name}`,
      body: `"${content.length > 120 ? content.slice(0, 120) + "..." : content}"`,
      ctaText: "View Candidate Notes",
      ctaUrl: "/recruiter/team",
      metadata: {
        noteId: note.id,
        candidateId,
        candidateName: candidate.name,
        jobId,
        jobTitle,
      },
    });
  }

  // Audit event
  await prisma.auditEvent.create({
    data: {
      actorId: authorId,
      action: "COLLABORATION_NOTE_CREATED",
      resourceType: "COLLABORATION_NOTE",
      resourceId: note.id,
      metadata: JSON.stringify({
        candidateId,
        candidateName: candidate.name,
        noteType,
        mentionsCount: mentions.length,
      }),
    },
  });

  return {
    id: note.id,
    companyId: note.companyId,
    authorId: note.authorId,
    authorName: note.author.name,
    candidateId: note.candidateId,
    candidateName: note.candidate.name,
    applicationId: note.applicationId,
    jobId: note.jobId,
    jobTitle,
    noteType: note.noteType,
    content: note.content,
    mentions,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

/**
 * Retrieves internal collaboration notes for a candidate, strictly scoped to companyId.
 */
export async function getNotesForCandidate(
  candidateId: string,
  companyId: string
): Promise<CollaborationNoteRecord[]> {
  const notes = await prisma.collaborationNote.findMany({
    where: { candidateId, companyId },
    include: {
      author: { select: { name: true } },
      candidate: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const jobIds = notes.map((n) => n.jobId).filter((id): id is string => !!id);
  const jobs = jobIds.length > 0
    ? await prisma.job.findMany({ where: { id: { in: jobIds } }, select: { id: true, title: true } })
    : [];
  const jobMap = new Map(jobs.map((j) => [j.id, j.title]));

  return notes.map((n) => {
    let mentions: Array<{ userId: string; name: string }> = [];
    try { mentions = JSON.parse(n.mentions); } catch {}

    return {
      id: n.id,
      companyId: n.companyId,
      authorId: n.authorId,
      authorName: n.author.name,
      candidateId: n.candidateId,
      candidateName: n.candidate.name,
      applicationId: n.applicationId,
      jobId: n.jobId,
      jobTitle: n.jobId ? jobMap.get(n.jobId) || null : null,
      noteType: n.noteType,
      content: n.content,
      mentions,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    };
  });
}

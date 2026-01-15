import mongoose, { Schema, Document } from "mongoose";


export const READ_ME_JOB_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type ReadmeJobStatus =
  (typeof READ_ME_JOB_STATUS)[keyof typeof READ_ME_JOB_STATUS];


export interface IReadmeJob extends Document {
  repo: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  status: ReadmeJobStatus;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}


const ReadmeJobSchema = new Schema<IReadmeJob>(
  {
    repo: {
      type: Schema.Types.ObjectId,
      ref: "GithubRepo",
      required: true,
      index: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(READ_ME_JOB_STATUS),
      default: READ_ME_JOB_STATUS.PENDING,
      index: true,
    },

    error: {
      type: String,
      maxlength: 1000, // prevents log / payload abuse
    },
  },
  {
    timestamps: true,
    strict: "throw", // blocks mass assignment
  }
);


ReadmeJobSchema.index(
  { repo: 1, user: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: READ_ME_JOB_STATUS.PENDING,
    },
  }
);


ReadmeJobSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 7 }
);


const ReadmeJob =
  mongoose.models.ReadmeJob ||
  mongoose.model<IReadmeJob>("ReadmeJob", ReadmeJobSchema);

export default ReadmeJob;

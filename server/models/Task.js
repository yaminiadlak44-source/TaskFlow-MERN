import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"]
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
      default: ""
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending"
    },
    meetingAt: {
      type: Date,
      default: null
    },
    meetingRoom: {
      type: String,
      trim: true,
      default: ""
    },
    teamMembers: {
      type: [
        {
          name: {
            type: String,
            required: [true, "Employee name is required"],
            trim: true,
            maxlength: [80, "Employee name cannot exceed 80 characters"]
          },
          responsibility: {
            type: String,
            required: [true, "Employee task is required"],
            trim: true,
            maxlength: [120, "Employee task cannot exceed 120 characters"]
          },
          progress: {
            type: Number,
            min: [0, "Progress cannot be below 0"],
            max: [100, "Progress cannot exceed 100"],
            default: 0
          }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);
export default Task;

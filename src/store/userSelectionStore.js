import { makeAutoObservable } from "mobx";

class UserSelectionStore {
  selectedUsers = [];

  constructor() {
    makeAutoObservable(this);
  }

  setSelectedUsers(users) {
    this.selectedUsers = users;
  }

  clearSelectedUsers() {
    this.selectedUsers = [];
  }
}

const userSelectionStore = new UserSelectionStore();
export default userSelectionStore;

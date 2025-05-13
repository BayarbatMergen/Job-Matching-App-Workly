import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "../config/firebase"; //  Firebase 설정 가져오기

const storage = getStorage(app);

//  Firebase Storage에 이미지 업로드
export const uploadImageToFirebase = async (uri, filePath) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef); //  업로드 후 URL 반환
  } catch (error) {
    console.error("이미지 업로드 실패:", error);
    throw error;
  }
};

import ActionSheet from "./src/index";
import { ActionSheetProps as Props } from "./src/types";
import { SheetManager } from "./src/sheetmanager";
import SheetProvider, { registerSheet, SheetProps } from "./src/provider";

export type ActionSheetProps = Props;

export default ActionSheet;
export { SheetManager, SheetProvider, registerSheet, SheetProps };

import React from 'react';
import { useDynamicAttributesEditor } from './hooks/useDynamicAttributesEditor';
import BasicConfigurationSection from './sections/BasicConfigurationSection';
import CpuSection from './sections/CpuSection';
import RamSection from './sections/RamSection';
import StorageSection from './sections/StorageSection';
import GpuSection from './sections/GpuSection';
import DisplaySection from './sections/DisplaySection';
import OsSection from './sections/OsSection';
import ConnectivitySection from './sections/ConnectivitySection';
import PackagingSection from './sections/PackagingSection';
import CameraSection from './sections/CameraSection';
import AudioSection from './sections/AudioSection';
import KeyboardSection from './sections/KeyboardSection';
import MonitorExtrasSection from './sections/MonitorExtrasSection';
import NotesSection from './sections/NotesSection';
import JsonPreviewSection from './sections/JsonPreviewSection';

const DynamicAttributesEditor: React.FC = () => {
	const {
		attributes,
		updateAttribute,
		currentProductKind,
		currentCpuBrand,
		isFieldVisible,
	} = useDynamicAttributesEditor();

	return (
		<div className='space-y-6'>
			<BasicConfigurationSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<CpuSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentCpuBrand={currentCpuBrand}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<RamSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<StorageSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<GpuSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<DisplaySection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<OsSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<ConnectivitySection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<PackagingSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<CameraSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<AudioSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<KeyboardSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<MonitorExtrasSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<NotesSection
				attributes={attributes}
				updateAttribute={updateAttribute}
				currentProductKind={currentProductKind}
				isFieldVisible={isFieldVisible}
			/>

			<JsonPreviewSection attributes={attributes} />
		</div>
	);
};

export default DynamicAttributesEditor;

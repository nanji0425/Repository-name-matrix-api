/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React from 'react';
import { Avatar, Typography, Tag, Space } from '@douyinfe/semi-ui';
import { IconInfoCircle } from '@douyinfe/semi-icons';
import { stringToColor } from '../../../../../helpers';

const { Text } = Typography;

const ModelBasicInfo = ({ modelData, vendorsMap = {}, t }) => {
  const getModelDescription = () => modelData?.description?.trim() || '';

  const getModelTags = () => {
    const tags = [];

    if (modelData?.tags) {
      const customTags = modelData.tags.split(',').filter((tag) => tag.trim());
      customTags.forEach((tag) => {
        const tagText = tag.trim();
        tags.push({ text: tagText, color: stringToColor(tagText) });
      });
    }

    return tags;
  };

  const modelDescription = getModelDescription();
  const modelTags = getModelTags();

  return (
    <div>
      <div className='flex items-center mb-4'>
        <Avatar size='small' color='blue' className='mr-2 shadow-md'>
          <IconInfoCircle size={16} />
        </Avatar>
        <div>
          <Text className='text-lg font-medium'>{t('基本信息')}</Text>
          <div className='text-xs text-gray-600'>
            {t('模型的详细描述和基本特性')}
          </div>
        </div>
      </div>
      <div className='text-gray-600'>
        {modelDescription && <p className='mb-4'>{modelDescription}</p>}
        {modelTags.length > 0 && (
          <Space wrap>
            {modelTags.map((tag, index) => (
              <Tag key={index} color={tag.color} shape='circle' size='small'>
                {tag.text}
              </Tag>
            ))}
          </Space>
        )}
      </div>
    </div>
  );
};

export default ModelBasicInfo;
